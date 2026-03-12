const baseUrl = process.env.SEA_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
const cronSecret = process.env.CRON_SECRET;
const targetUrl = process.argv[2];

async function run() {
  const endpoint = new URL("/api/crawl", baseUrl);

  if (targetUrl) {
    endpoint.searchParams.set("url", targetUrl);
  }

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      accept: "application/json",
      ...(cronSecret ? { authorization: `Bearer ${cronSecret}` } : {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Crawler request failed.");
    if (payload) {
      console.error(JSON.stringify(payload, null, 2));
    }
    process.exit(1);
  }

  console.log(JSON.stringify(payload, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});