import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { Redis } from "@upstash/redis";

export type IndexedSite = {
  id: string;
  url: string;
  hostname: string;
  title: string;
  description: string;
  lastCrawledAt: string;
  pageCount: number;
  robotsUrl: string;
  aiGeneratedBy?: string;
  aiGeneratedDate?: string;
};

export type IndexedPage = {
  id: string;
  siteId: string;
  siteName: string;
  siteUrl: string;
  title: string;
  description: string;
  url: string;
  summary: string;
  content: string;
  aiGenerated: true;
  aiGeneratedBy?: string;
  aiGeneratedDate?: string;
  indexedAt: string;
};

export type CrawlRunResult = {
  url: string;
  status: string;
  pageCount?: number;
  message?: string;
};

export type CrawlRun = {
  id: string;
  trigger: "seed" | "single-url" | "submission";
  ranAt: string;
  requestedUrls: string[];
  indexed: number;
  total: number;
  results: CrawlRunResult[];
};

export type DocsRequest = {
  id: string;
  name: string;
  email?: string;
  url?: string;
  message: string;
  createdAt: string;
};

export type IndexDatabase = {
  generatedAt: string | null;
  seeds: string[];
  sites: IndexedSite[];
  pages: IndexedPage[];
  submissions: string[];
  crawlRuns: CrawlRun[];
  docsRequests: DocsRequest[];
};

export type UpsertPayload = {
  site: IndexedSite;
  pages: IndexedPage[];
  submittedUrl?: string;
};

export type SearchResult = IndexedPage & {
  score: number;
};

const REPO_DATA_DIR = path.join(process.cwd(), "data");
const ACTIVE_DATA_DIR = process.env.SEA_DATA_DIR ?? REPO_DATA_DIR;
const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_DATABASE_KEY = process.env.SEA_STORAGE_KEY ?? "sea:index";

const SEEDS_PATH = path.join(ACTIVE_DATA_DIR, "seeds.json");
const DATABASE_PATH = path.join(ACTIVE_DATA_DIR, "index.json");

const DEFAULT_DATABASE: IndexDatabase = {
  generatedAt: null,
  seeds: ["https://thequery.in"],
  sites: [],
  pages: [],
  submissions: [],
  crawlRuns: [],
  docsRequests: [],
};

let storageWriteQueue = Promise.resolve();
let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  redisClient = REDIS_URL && REDIS_TOKEN
    ? new Redis({
        url: REDIS_URL,
        token: REDIS_TOKEN,
      })
    : null;

  return redisClient;
}

async function ensureJsonFile(targetPath: string, fallbackName: string, defaultValue: unknown) {
  await mkdir(path.dirname(targetPath), { recursive: true });

  try {
    await readFile(targetPath, "utf8");
    return;
  } catch {
    const fallbackPath = path.join(REPO_DATA_DIR, fallbackName);

    try {
      const fallback = await readFile(fallbackPath, "utf8");
      await writeJsonAtomically(targetPath, JSON.parse(fallback) as unknown);
      return;
    } catch {
      await writeJsonAtomically(targetPath, defaultValue);
    }
  }
}

async function writeJsonAtomically(targetPath: string, value: unknown) {
  await mkdir(path.dirname(targetPath), { recursive: true });

  const tempPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.tmp`,
  );

  await writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  await rename(tempPath, targetPath);
}

async function withStorageWriteLock<T>(operation: () => Promise<T>) {
  const run = storageWriteQueue.then(operation, operation);
  storageWriteQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function normalizeSeeds(seeds: string[]) {
  return [...new Set(seeds.map((seed) => seed.trim()).filter(Boolean))].sort();
}

function normalizeDatabase(database?: Partial<IndexDatabase> | null): IndexDatabase {
  return {
    ...DEFAULT_DATABASE,
    ...database,
    seeds: database?.seeds?.length ? normalizeSeeds(database.seeds) : DEFAULT_DATABASE.seeds,
    sites: database?.sites ?? DEFAULT_DATABASE.sites,
    pages: database?.pages ?? DEFAULT_DATABASE.pages,
    submissions: database?.submissions ?? DEFAULT_DATABASE.submissions,
    crawlRuns: database?.crawlRuns ?? DEFAULT_DATABASE.crawlRuns,
    docsRequests: database?.docsRequests ?? DEFAULT_DATABASE.docsRequests,
  };
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizePageUrl(value: string) {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return value.trim().replace(/\/$/, "");
  }
}

function createPageFingerprint(page: IndexedPage) {
  const signature = [
    page.siteId,
    normalizeText(page.title),
    normalizeText(page.description),
    normalizeText(page.summary),
    normalizeText(page.content).slice(0, 500),
  ].join("|");

  return createStableId(signature);
}

function dedupePages(pages: IndexedPage[]) {
  const seenUrls = new Set<string>();
  const seenFingerprints = new Set<string>();
  const deduped: IndexedPage[] = [];

  for (const page of pages) {
    const normalizedUrl = normalizePageUrl(page.url);
    const fingerprint = createPageFingerprint(page);

    if (seenUrls.has(normalizedUrl) || seenFingerprints.has(fingerprint)) {
      continue;
    }

    seenUrls.add(normalizedUrl);
    seenFingerprints.add(fingerprint);
    deduped.push({
      ...page,
      url: normalizedUrl,
      id: createStableId(`${page.siteId}:${normalizedUrl}`),
    });
  }

  return deduped;
}

async function readSeedsFromDisk() {
  await ensureJsonFile(SEEDS_PATH, "seeds.json", DEFAULT_DATABASE.seeds);
  const raw = await readFile(SEEDS_PATH, "utf8");
  const parsed = JSON.parse(raw) as string[];
  return normalizeSeeds(parsed);
}

async function readDatabaseFromDisk(): Promise<IndexDatabase> {
  await ensureJsonFile(DATABASE_PATH, "index.json", DEFAULT_DATABASE);
  const raw = await readFile(DATABASE_PATH, "utf8");
  const parsed = JSON.parse(raw) as IndexDatabase;

  return normalizeDatabase({
    ...parsed,
    seeds: parsed.seeds?.length ? normalizeSeeds(parsed.seeds) : await readSeedsFromDisk(),
  });
}

async function readDatabaseFromRedis(): Promise<IndexDatabase> {
  const redis = getRedisClient();

  if (!redis) {
    return readDatabaseFromDisk();
  }

  const stored = await redis.get<IndexDatabase>(REDIS_DATABASE_KEY);

  if (stored) {
    return normalizeDatabase(stored);
  }

  const fallback = await readDatabaseFromDisk();
  await redis.set(REDIS_DATABASE_KEY, normalizeDatabase(fallback));
  return normalizeDatabase(fallback);
}

async function writeDatabaseToRedis(database: IndexDatabase) {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  await redis.set(REDIS_DATABASE_KEY, normalizeDatabase(database));
}

export function createStableId(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 16);
}

export async function readSeeds() {
  const database = await readDatabase();
  return database.seeds;
}

export async function writeSeeds(seeds: string[]) {
  await updateDatabase((database) => ({
    ...database,
    seeds: normalizeSeeds(seeds),
  }));
}

export async function readDatabase(): Promise<IndexDatabase> {
  return readDatabaseFromRedis();
}

export async function writeDatabase(database: IndexDatabase) {
  await withStorageWriteLock(async () => {
    const normalized = normalizeDatabase({
      ...database,
      generatedAt: new Date().toISOString(),
      seeds: normalizeSeeds(database.seeds),
    });

    if (getRedisClient()) {
      await writeDatabaseToRedis(normalized);
      return;
    }

    await ensureJsonFile(DATABASE_PATH, "index.json", DEFAULT_DATABASE);
    await writeJsonAtomically(DATABASE_PATH, normalized);
  });
}

async function updateDatabase(mutator: (database: IndexDatabase) => IndexDatabase) {
  return withStorageWriteLock(async () => {
    const database = await readDatabase();
    const updatedDatabase = mutator(database);
    const normalizedDatabase = normalizeDatabase({
      ...updatedDatabase,
      seeds: normalizeSeeds(updatedDatabase.seeds),
      generatedAt: new Date().toISOString(),
    });

    if (getRedisClient()) {
      await writeDatabaseToRedis(normalizedDatabase);
      return normalizedDatabase;
    }

    await writeJsonAtomically(SEEDS_PATH, normalizedDatabase.seeds);
    await writeJsonAtomically(DATABASE_PATH, normalizedDatabase);
    return normalizedDatabase;
  });
}

export async function addSeed(url: string) {
  await updateDatabase((database) => ({
    ...database,
    seeds: [...database.seeds, url],
  }));
}

export async function recordSubmission(url: string) {
  await updateDatabase((database) => ({
    ...database,
    submissions: [...new Set([url, ...database.submissions])].slice(0, 100),
  }));
}

export async function upsertIndexedSite(payload: UpsertPayload) {
  const submittedUrl = payload.submittedUrl ?? payload.site.url;

  return updateDatabase((database) => {
    const nextSites = database.sites.filter((site) => site.id !== payload.site.id);
    const nextPages = database.pages.filter((page) => page.siteId !== payload.site.id);
    const dedupedPages = dedupePages(payload.pages);
    const site = {
      ...payload.site,
      pageCount: dedupedPages.length,
    };

    return {
      ...database,
      seeds: [...database.seeds, payload.site.url],
      submissions: [...new Set([submittedUrl, ...database.submissions])].slice(0, 100),
      sites: [site, ...nextSites].sort((left, right) =>
        right.lastCrawledAt.localeCompare(left.lastCrawledAt),
      ),
      pages: [...dedupedPages, ...nextPages].sort((left, right) =>
        right.indexedAt.localeCompare(left.indexedAt),
      ),
    };
  });
}

export async function recordCrawlRun(payload: Omit<CrawlRun, "id">) {
  return updateDatabase((database) => ({
    ...database,
    crawlRuns: [
      {
        ...payload,
        id: createStableId(`${payload.trigger}:${payload.ranAt}:${payload.requestedUrls.join(",")}`),
      },
      ...database.crawlRuns,
    ].slice(0, 50),
  }));
}

export async function recordDocsRequest(payload: Omit<DocsRequest, "id" | "createdAt">) {
  return updateDatabase((database) => ({
    ...database,
    docsRequests: [
      {
        ...payload,
        id: createStableId(`${payload.name}:${payload.email ?? ""}:${payload.url ?? ""}:${Date.now()}`),
        createdAt: new Date().toISOString(),
      },
      ...database.docsRequests,
    ].slice(0, 100),
  }));
}

function countTermMatches(value: string, terms: string[]) {
  const haystack = value.toLowerCase();

  return terms.reduce((score, term) => {
    let index = haystack.indexOf(term);
    let matches = 0;

    while (index !== -1) {
      matches += 1;
      index = haystack.indexOf(term, index + term.length);
    }

    return score + matches;
  }, 0);
}

function scorePage(page: IndexedPage, query: string, terms: string[]) {
  if (!terms.length) {
    return 0;
  }

  const exactQuery = query.toLowerCase();
  let score = 0;

  score += countTermMatches(page.title, terms) * 10;
  score += countTermMatches(page.description, terms) * 8;
  score += countTermMatches(page.siteName, terms) * 7;
  score += countTermMatches(page.summary, terms) * 5;
  score += countTermMatches(page.url, terms) * 4;
  score += countTermMatches(page.content, terms) * 2;

  if (page.title.toLowerCase().includes(exactQuery)) {
    score += 20;
  }

  if (page.description.toLowerCase().includes(exactQuery)) {
    score += 12;
  }

  if (page.summary.toLowerCase().includes(exactQuery)) {
    score += 8;
  }

  return score;
}

export function searchPages(pages: IndexedPage[], query: string): SearchResult[] {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    return [...pages]
      .sort((left, right) => right.indexedAt.localeCompare(left.indexedAt))
      .map((page) => ({
        ...page,
        score: 0,
      }));
  }

  const terms = trimmed.split(/\s+/).filter(Boolean);

  return pages
    .map((page) => {
      const haystack = [
        page.siteName,
        page.title,
        page.description,
        page.summary,
        page.content,
        page.url,
      ]
        .join(" ")
        .toLowerCase();

      return {
        ...page,
        score: terms.every((term) => haystack.includes(term))
          ? scorePage(page, trimmed, terms)
          : -1,
      };
    })
    .filter((page) => page.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.indexedAt.localeCompare(left.indexedAt);
    });
}