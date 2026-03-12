import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { crawlSite } from "@/lib/crawler";
import { readSeeds, recordCrawlRun, upsertIndexedSite } from "@/lib/storage";

export const runtime = "nodejs";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim();
}

function isAuthorizedCrawlRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const token = getBearerToken(request);

  if (!token) {
    return false;
  }

  const secretBuffer = Buffer.from(secret);
  const tokenBuffer = Buffer.from(token);

  if (secretBuffer.length !== tokenBuffer.length) {
    return false;
  }

  return timingSafeEqual(secretBuffer, tokenBuffer);
}

function getUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized crawl request." },
    { status: 401 },
  );
}

function getMisconfiguredResponse() {
  return NextResponse.json(
    { error: "CRON_SECRET must be configured in production." },
    { status: 503 },
  );
}

async function runCrawl(urls: string[]) {
  const results = [] as Array<{
    url: string;
    status: string;
    pageCount?: number;
    message?: string;
  }>;

  for (const url of urls) {
    const outcome = await crawlSite(url);

    if (outcome.status === "indexed") {
      await upsertIndexedSite({
        site: outcome.site,
        pages: outcome.pages,
        submittedUrl: url,
      });

      results.push({
        url: outcome.site.url,
        status: outcome.status,
        pageCount: outcome.pages.length,
      });
      continue;
    }

    results.push({
      url: outcome.normalizedUrl,
      status: outcome.status,
      message: outcome.status === "error" ? outcome.message : outcome.instructions,
    });
  }

  return results;
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return getMisconfiguredResponse();
  }

  if (!isAuthorizedCrawlRequest(request)) {
    return getUnauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const singleUrl = searchParams.get("url")?.trim();
  const seeds = singleUrl ? [singleUrl] : await readSeeds();
  const results = await runCrawl(seeds);
  const ranAt = new Date().toISOString();
  const indexed = results.filter((result) => result.status === "indexed").length;

  await recordCrawlRun({
    trigger: singleUrl ? "single-url" : "seed",
    ranAt,
    requestedUrls: seeds,
    indexed,
    total: results.length,
    results,
  });

  return NextResponse.json({
    ranAt,
    total: results.length,
    indexed,
    results,
  });
}

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return getMisconfiguredResponse();
  }

  if (!isAuthorizedCrawlRequest(request)) {
    return getUnauthorizedResponse();
  }

  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const seeds = body?.url?.trim() ? [body.url.trim()] : await readSeeds();
  const results = await runCrawl(seeds);
  const ranAt = new Date().toISOString();
  const indexed = results.filter((result) => result.status === "indexed").length;

  await recordCrawlRun({
    trigger: body?.url?.trim() ? "single-url" : "seed",
    ranAt,
    requestedUrls: seeds,
    indexed,
    total: results.length,
    results,
  });

  return NextResponse.json({
    ranAt,
    total: results.length,
    indexed,
    results,
  });
}