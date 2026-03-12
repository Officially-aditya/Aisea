# SEA

SEA is a small search engine for websites that explicitly opt in to AI-generated indexing via `robots.txt`.

It does three things:

1. Reads a seed list or submitted URL.
2. Checks `robots.txt` for `ai-generated: true`.
3. Crawls a handful of HTML pages and stores results in durable Vercel-compatible storage.

Public routes:

1. `/` for search
2. `/index` for the focused publisher onboarding page
2. `/submit` for direct site submission
3. `/docs` for FAQ, API usage, and support requests

## robots.txt format

SEA looks for this directive:

```txt
ai-generated: true
ai-generated-by: Claude
ai-generated-date: 2026-03-11
```

Only `ai-generated: true` is required.

## How the crawler works

Yes: SEA crawls websites that are requested.

There are two paths:

1. Submit flow: posting a URL to `/api/submit` checks that specific site and, if opted in, indexes it immediately.
2. Crawl flow: `/api/crawl` scans the saved seed list, and `/api/crawl?url=https://example.com` scans one requested site directly.

The crawler does not scan the whole web. It only crawls:

1. Seed URLs stored in `data/seeds.json`.
2. URLs submitted through the submit form or passed to the crawl endpoint.

## Data storage

SEA now uses Redis-compatible storage in production on Vercel.

The storage layer accepts either of these environment-variable pairs:

1. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
2. `KV_REST_API_URL` and `KV_REST_API_TOKEN`

Locally, if those variables are not present, SEA falls back to the files in `data/` so development still works without cloud services.

The datastore keeps:

1. Seeds
2. Indexed sites
3. Indexed pages
4. Recent submissions
5. Crawl-run history

Writes are still serialized in-process to reduce accidental overwrite races during low-volume MVP usage.

## Local setup

Requirements:

1. Node.js 20 or newer
2. npm

Install dependencies:

```bash
npm install
```

Run the app in development:

```bash
npm run dev
```

If you want local development to use cloud storage too, set the Redis env vars before starting the app.

Open:

```txt
http://localhost:3000
```

Build and run production locally:

```bash
npm run build
npm run start
```

## Manual crawling

If the app is running locally, you can trigger a crawl from the terminal.

Crawl all seed sites:

```bash
npm run crawl
```

Crawl one requested site:

```bash
npm run crawl -- https://example.com
```

You can also hit the API directly:

```bash
curl "http://127.0.0.1:3000/api/crawl"
curl "http://127.0.0.1:3000/api/crawl?url=https://example.com"
```

## Search behavior

Search is intentionally simple for the MVP.

SEA loads indexed page objects from JSON and does a manual text match across:

1. Site name
2. Title
3. Description
4. Summary
5. Content
6. URL

Results are then ranked with a small relevance score that favors:

1. Title matches first
2. Description and site-name matches next
3. Summary and URL matches after that
4. Content matches last
5. More recent pages as a tiebreaker

This keeps the search simple while making obvious matches rise higher.

SEA also dedupes indexed pages within a site using:

1. A normalized URL check
2. A content fingerprint based on title, description, summary, and content excerpt

That helps avoid clutter when a site exposes the same article through multiple near-identical pages.

## Admin view

SEA includes a small local admin page at:

```txt
http://localhost:3000/admin
```

It shows:

1. Site, page, submission, and crawl-run counts
2. Recent crawl runs and their outcomes
3. Recent submitted URLs
4. Recently indexed pages
5. Messages submitted through the docs page

The admin route is protected with HTTP Basic Auth.

You must define these environment variables:

1. `SEA_ADMIN_USERNAME`
2. `SEA_ADMIN_PASSWORD`

If they are missing, the admin route fails closed and returns `503` instead of exposing the page.

## Running SEA on your laptop

This setup is valid for a personal machine.

Typical workflow:

1. Keep the app running with `npm run start`.
2. Visit the site in the browser.
3. Trigger crawls manually with `npm run crawl`.
4. Optionally schedule the crawl command with cron.

Example cron entry to crawl every 6 hours:

```cron
0 */6 * * * cd /Users/addy/Downloads/sea && /usr/bin/npm run crawl >> /tmp/sea-crawl.log 2>&1
```

If `npm` is not at `/usr/bin/npm` on your machine, replace it with the result of `which npm`.

## Notes on Vercel

SEA is now set up to work cleanly on Vercel.

Recommended deployment setup:

1. Deploy the Next.js app to Vercel.
2. Add a Redis integration in Vercel.
3. Confirm Vercel provides either `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or the `KV_REST_API_*` equivalents.
4. Set `SEA_ADMIN_USERNAME` and `SEA_ADMIN_PASSWORD` in the Vercel project environment.
5. Keep the existing cron in `vercel.json` if you want scheduled crawling.

That gives SEA durable indexed data on Vercel without moving to Postgres yet.

## Docs page

SEA now includes a public docs page intended for a route like `https://aisea.in/docs`.

It includes:

1. Quick start indexing instructions
2. A dedicated `/index` style submit flow linked from docs
2. Browser-based submit flow
3. API examples for search, submit, crawl, and docs support
4. FAQ content
5. A support form stored in the app database

The support form posts to:

```txt
POST /api/docs/request
```

Required JSON fields:

1. `name`
2. `message`

Optional fields:

1. `email`
2. `url`

## Rate limits

Public write endpoints are rate limited by client IP.

1. `POST /api/submit`: 8 requests per hour
2. `POST /api/docs/request`: 6 requests per hour

When a limit is exceeded, the API returns `429` with `Retry-After` and `X-RateLimit-*` headers.
