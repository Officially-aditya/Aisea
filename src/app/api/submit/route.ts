import { NextResponse } from "next/server";

import { crawlSite } from "@/lib/crawler";
import { applyRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { addSeed, recordCrawlRun, recordSubmission, upsertIndexedSite } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await applyRateLimit(request, "submit", {
    limit: 8,
    windowInSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many submission attempts. Try again later." },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimit),
      },
    );
  }

  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const submittedUrl = body?.url?.trim();

  if (!submittedUrl) {
    return NextResponse.json(
      { error: "A URL is required." },
      { status: 400, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  await recordSubmission(submittedUrl);
  const outcome = await crawlSite(submittedUrl);
  const ranAt = new Date().toISOString();

  if (outcome.status === "indexed") {
    await addSeed(outcome.site.url);
    await upsertIndexedSite({
      site: outcome.site,
      pages: outcome.pages,
      submittedUrl,
    });
    await recordCrawlRun({
      trigger: "submission",
      ranAt,
      requestedUrls: [submittedUrl],
      indexed: 1,
      total: 1,
      results: [
        {
          url: outcome.site.url,
          status: outcome.status,
          pageCount: outcome.pages.length,
        },
      ],
    });

    return NextResponse.json({
      status: outcome.status,
      site: outcome.site,
      pageCount: outcome.pages.length,
      robotsUrl: outcome.robotsUrl,
    }, { headers: createRateLimitHeaders(rateLimit) });
  }

  if (outcome.status === "not-opted-in") {
    await recordCrawlRun({
      trigger: "submission",
      ranAt,
      requestedUrls: [submittedUrl],
      indexed: 0,
      total: 1,
      results: [
        {
          url: outcome.normalizedUrl,
          status: outcome.status,
          message: outcome.instructions,
        },
      ],
    });

    return NextResponse.json(
      {
        status: outcome.status,
        robotsUrl: outcome.robotsUrl,
        instructions: outcome.instructions,
        suggestedSnippet: "ai-generated: true\nai-generated-by: Claude\nai-generated-date: 2026-03-11",
      },
      { status: 422, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  await recordCrawlRun({
    trigger: "submission",
    ranAt,
    requestedUrls: [submittedUrl],
    indexed: 0,
    total: 1,
    results: [
      {
        url: outcome.normalizedUrl,
        status: outcome.status,
        message: outcome.message,
      },
    ],
  });

  return NextResponse.json(
    {
      status: outcome.status,
      message: outcome.message,
      robotsUrl: outcome.robotsUrl,
    },
    { status: 500, headers: createRateLimitHeaders(rateLimit) },
  );
}