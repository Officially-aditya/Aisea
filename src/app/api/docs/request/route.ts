import { NextResponse } from "next/server";

import { applyRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { recordDocsRequest } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await applyRateLimit(request, "docs-request", {
    limit: 6,
    windowInSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many docs requests. Try again later." },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimit),
      },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    url?: string;
    message?: string;
  } | null;

  const name = body?.name?.trim();
  const email = body?.email?.trim();
  const url = body?.url?.trim();
  const message = body?.message?.trim();

  if (!name || !message) {
    return NextResponse.json(
      { error: "Name and message are required." },
      { status: 400, headers: createRateLimitHeaders(rateLimit) },
    );
  }

  await recordDocsRequest({
    name,
    email,
    url,
    message,
  });

  return NextResponse.json({
    ok: true,
    message: "Your request was saved.",
  }, { headers: createRateLimitHeaders(rateLimit) });
}