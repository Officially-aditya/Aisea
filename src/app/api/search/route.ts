import { NextResponse } from "next/server";

import { readDatabase, searchPages } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const database = await readDatabase();
  const results = searchPages(database.pages, query).slice(0, 50);

  return NextResponse.json({
    query,
    count: results.length,
    results,
  });
}