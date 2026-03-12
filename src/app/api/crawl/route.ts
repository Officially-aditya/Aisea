import { NextResponse } from "next/server";

import { crawlSite } from "@/lib/crawler";
import { readSeeds, recordCrawlRun, upsertIndexedSite } from "@/lib/storage";

export const runtime = "nodejs";

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