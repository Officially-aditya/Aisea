import { load } from "cheerio";

import { createStableId, type IndexedPage, type IndexedSite } from "@/lib/storage";

const USER_AGENT = "SEA/0.1 (+https://sea.local)";
const HTML_EXTENSIONS_TO_SKIP = /\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|xml|json|txt|mp3|mp4|mov|avi|woff2?|ttf)$/i;

type RobotsDirective = {
  enabled: boolean;
  by?: string;
  date?: string;
};

export type CrawlOutcome =
  | {
      status: "indexed";
      normalizedUrl: string;
      robotsUrl: string;
      directive: RobotsDirective;
      site: IndexedSite;
      pages: IndexedPage[];
    }
  | {
      status: "not-opted-in";
      normalizedUrl: string;
      robotsUrl: string;
      directive: RobotsDirective;
      instructions: string;
    }
  | {
      status: "error";
      normalizedUrl: string;
      robotsUrl?: string;
      message: string;
    };

function withProtocol(input: string) {
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
}

export function normalizeUrl(input: string) {
  const parsed = new URL(withProtocol(input.trim()));
  parsed.hash = "";
  if (parsed.pathname === "/") {
    parsed.pathname = "";
  }
  return parsed.toString().replace(/\/$/, "");
}

function buildRobotsUrl(siteUrl: string) {
  const parsed = new URL(siteUrl);
  parsed.pathname = "/robots.txt";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function parseDirectiveValue(value: string) {
  return value.replace(/\s+#.*$/, "").trim();
}

export function parseAiDirective(robotsContent: string): RobotsDirective {
  const directive: RobotsDirective = { enabled: false };

  for (const rawLine of robotsContent.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes(":")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = parseDirectiveValue(line.slice(separatorIndex + 1));

    if (key === "ai-generated") {
      directive.enabled = value.toLowerCase() === "true";
    }

    if (key === "ai-generated-by") {
      directive.by = value;
    }

    if (key === "ai-generated-date") {
      directive.date = value;
    }
  }

  return directive;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/plain,text/html;q=0.9,*/*;q=0.1",
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return {
    body: await response.text(),
    finalUrl: response.url,
    contentType: response.headers.get("content-type") ?? "",
  };
}

function collapseWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function normalizedTextMatch(left: string, right: string) {
  return collapseWhitespace(left).toLowerCase() === collapseWhitespace(right).toLowerCase();
}

function summarizeText(text: string, maxLength = 280) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function extractInternalLinks(html: string, pageUrl: string, limit: number) {
  const $ = load(html);
  const origin = new URL(pageUrl).origin;
  const links = new Set<string>();

  $("a[href]").each((_, element) => {
    if (links.size >= limit) {
      return false;
    }

    const href = $(element).attr("href");
    if (!href) {
      return;
    }

    try {
      const resolved = new URL(href, pageUrl);
      resolved.hash = "";

      if (
        resolved.origin !== origin ||
        resolved.protocol.startsWith("mailto") ||
        resolved.protocol.startsWith("tel") ||
        HTML_EXTENSIONS_TO_SKIP.test(resolved.pathname)
      ) {
        return;
      }

      const normalized = resolved.toString().replace(/\/$/, "");
      links.add(normalized);
    } catch {
      return;
    }
  });

  return [...links];
}

function extractPageRecord(html: string, pageUrl: string, siteId: string, directive: RobotsDirective): IndexedPage {
  const $ = load(html);
  const title = collapseWhitespace($("title").first().text()) || new URL(pageUrl).hostname;
  const description = collapseWhitespace(
    $("meta[name='description']").attr("content") ??
      $("meta[property='og:description']").attr("content") ??
      "",
  );

  const textSource = collapseWhitespace(
    $("main").text() || $("article").text() || $("body").text() || "",
  );
  const content = summarizeText(textSource, 2200);
  const summarySource = description && normalizedTextMatch(description, textSource)
    ? ""
    : textSource;
  const summary = summarizeText(summarySource || title, 300);
  const hostname = new URL(pageUrl).hostname.replace(/^www\./, "");
  const indexedAt = new Date().toISOString();

  return {
    id: createStableId(`${siteId}:${pageUrl}`),
    siteId,
    siteName: hostname,
    siteUrl: new URL(pageUrl).origin,
    title,
    description,
    url: pageUrl,
    summary,
    content,
    aiGenerated: true,
    aiGeneratedBy: directive.by,
    aiGeneratedDate: directive.date,
    indexedAt,
  };
}

export async function crawlSite(inputUrl: string, maxPages = 8): Promise<CrawlOutcome> {
  const normalizedUrl = normalizeUrl(inputUrl);
  const robotsUrl = buildRobotsUrl(normalizedUrl);

  try {
    const robotsResponse = await fetchText(robotsUrl);
    const directive = parseAiDirective(robotsResponse.body);

    if (!directive.enabled) {
      return {
        status: "not-opted-in",
        normalizedUrl,
        robotsUrl,
        directive,
        instructions:
          "Add `ai-generated: true` to robots.txt, optionally with `ai-generated-by` and `ai-generated-date`, then resubmit the site.",
      };
    }

    const queue = [normalizedUrl];
    const visited = new Set<string>();
    const pages: IndexedPage[] = [];
    const siteId = createStableId(new URL(normalizedUrl).hostname.replace(/^www\./, ""));

    while (queue.length > 0 && pages.length < maxPages) {
      const nextUrl = queue.shift();
      if (!nextUrl || visited.has(nextUrl)) {
        continue;
      }

      visited.add(nextUrl);

      try {
        const pageResponse = await fetchText(nextUrl);
        if (!pageResponse.contentType.includes("text/html")) {
          continue;
        }

        const page = extractPageRecord(pageResponse.body, pageResponse.finalUrl, siteId, directive);
        pages.push(page);

        for (const link of extractInternalLinks(pageResponse.body, pageResponse.finalUrl, maxPages * 2)) {
          if (!visited.has(link) && queue.length + pages.length < maxPages * 3) {
            queue.push(link);
          }
        }
      } catch {
        continue;
      }
    }

    if (pages.length === 0) {
      return {
        status: "error",
        normalizedUrl,
        robotsUrl,
        message: "The site opted in, but no HTML pages could be indexed.",
      };
    }

    const homepage = pages[0];
    const site: IndexedSite = {
      id: siteId,
      url: new URL(normalizedUrl).origin,
      hostname: new URL(normalizedUrl).hostname.replace(/^www\./, ""),
      title: homepage.title,
      description: homepage.description || homepage.summary,
      lastCrawledAt: new Date().toISOString(),
      pageCount: pages.length,
      robotsUrl,
      aiGeneratedBy: directive.by,
      aiGeneratedDate: directive.date,
    };

    return {
      status: "indexed",
      normalizedUrl,
      robotsUrl,
      directive,
      site,
      pages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown crawl error";
    return {
      status: "error",
      normalizedUrl,
      robotsUrl,
      message,
    };
  }
}