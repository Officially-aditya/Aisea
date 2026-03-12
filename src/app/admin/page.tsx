import Link from "next/link";

import { readDatabase } from "@/lib/storage";

export const dynamic = "force-dynamic";

function formatDayLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function buildSubmissionAnalytics(
  crawlRuns: Awaited<ReturnType<typeof readDatabase>>["crawlRuns"],
  docsRequests: Awaited<ReturnType<typeof readDatabase>>["docsRequests"],
) {
  const submissionRuns = crawlRuns.filter((run) => run.trigger === "submission");
  const acceptedRuns = submissionRuns.filter((run) => run.indexed > 0);
  const rejectedRuns = submissionRuns.filter((run) => run.indexed === 0);
  const today = new Date();
  const dailyStats = [] as Array<{
    key: string;
    label: string;
    submissions: number;
    accepted: number;
    rejected: number;
    docsRequests: number;
  }>;

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const key = date.toISOString().slice(0, 10);
    const submissions = submissionRuns.filter((run) => {
      const ranAt = new Date(run.ranAt);
      return ranAt >= date && ranAt < nextDate;
    });
    const docs = docsRequests.filter((request) => {
      const createdAt = new Date(request.createdAt);
      return createdAt >= date && createdAt < nextDate;
    });

    dailyStats.push({
      key,
      label: formatDayLabel(date),
      submissions: submissions.length,
      accepted: submissions.filter((run) => run.indexed > 0).length,
      rejected: submissions.filter((run) => run.indexed === 0).length,
      docsRequests: docs.length,
    });
  }

  const totalSubmissions = submissionRuns.length;
  const acceptanceRate = totalSubmissions
    ? Math.round((acceptedRuns.length / totalSubmissions) * 100)
    : 0;
  const maxDailySubmissions = Math.max(1, ...dailyStats.map((day) => day.submissions));

  return {
    totalSubmissions,
    acceptedRuns: acceptedRuns.length,
    rejectedRuns: rejectedRuns.length,
    acceptanceRate,
    dailyStats,
    maxDailySubmissions,
  };
}

export default async function AdminPage() {
  const database = await readDatabase();
  const recentRuns = database.crawlRuns.slice(0, 8);
  const recentSubmissions = database.submissions.slice(0, 12);
  const recentPages = database.pages.slice(0, 8);
  const recentDocsRequests = database.docsRequests.slice(0, 8);
  const analytics = buildSubmissionAnalytics(database.crawlRuns, database.docsRequests);

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">SEA</span>
          <span>Search Engine for AI Generated Content</span>
        </Link>
        <div className="nav-links">
          <Link href="/">Search</Link>
          <Link href="/about">About</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/index">Get indexed</Link>
          <Link href="/submit">Submit</Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">Admin</span>
        <h1>Inspect the local index.</h1>
        <p>
          This page is a thin window into the JSON datastore. It shows what has been submitted,
          what the crawler has done recently, and how many pages are currently in the index.
        </p>
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="eyebrow">Sites</span>
            <strong>{database.sites.length}</strong>
            <p>Distinct opted-in domains in the index.</p>
          </div>
          <div className="stat-card">
            <span className="eyebrow">Pages</span>
            <strong>{database.pages.length}</strong>
            <p>Deduped indexed pages stored in JSON.</p>
          </div>
          <div className="stat-card">
            <span className="eyebrow">Submissions</span>
            <strong>{database.submissions.length}</strong>
            <p>Most recent submitted URLs tracked locally.</p>
          </div>
          <div className="stat-card">
            <span className="eyebrow">Crawl Runs</span>
            <strong>{database.crawlRuns.length}</strong>
            <p>Recent crawler jobs retained for inspection.</p>
          </div>
          <div className="stat-card">
            <span className="eyebrow">Docs Requests</span>
            <strong>{database.docsRequests.length}</strong>
            <p>Messages left through the public docs page.</p>
          </div>
        </div>
      </section>

      <section className="panel analytics-panel" style={{ marginTop: 24 }}>
        <div className="table-row-header">
          <div>
            <span className="eyebrow">Analytics</span>
            <h3>Submission health over time</h3>
          </div>
          <span className="badge badge-neutral">Last 7 days</span>
        </div>

        <div className="analytics-grid">
          <div className="stat-card">
            <span className="eyebrow">Total submissions</span>
            <strong>{analytics.totalSubmissions}</strong>
            <p>All recorded submit attempts through the public form and API.</p>
          </div>
          <div className="stat-card">
            <span className="eyebrow">Accepted sites</span>
            <strong>{analytics.acceptedRuns}</strong>
            <p>Submission runs that passed robots.txt and were indexed.</p>
          </div>
          <div className="stat-card">
            <span className="eyebrow">Rejected submissions</span>
            <strong>{analytics.rejectedRuns}</strong>
            <p>Submission runs that were declined or failed validation.</p>
          </div>
          <div className="stat-card">
            <span className="eyebrow">Acceptance rate</span>
            <strong>{analytics.acceptanceRate}%</strong>
            <p>Accepted submissions divided by total submission runs.</p>
          </div>
        </div>

        <div className="trend-grid">
          {analytics.dailyStats.map((day) => (
            <article className="trend-card" key={day.key}>
              <div className="table-row-header">
                <strong>{day.label}</strong>
                <span className="microcopy">{day.submissions} submissions</span>
              </div>
              <div className="trend-bars" aria-hidden="true">
                <span
                  className="trend-bar trend-bar-total"
                  style={{ height: `${Math.max(12, (day.submissions / analytics.maxDailySubmissions) * 96)}px` }}
                />
                <span
                  className="trend-bar trend-bar-accepted"
                  style={{ height: `${Math.max(12, (Math.max(day.accepted, 0) / analytics.maxDailySubmissions) * 96)}px` }}
                />
                <span
                  className="trend-bar trend-bar-rejected"
                  style={{ height: `${Math.max(12, (Math.max(day.rejected, 0) / analytics.maxDailySubmissions) * 96)}px` }}
                />
              </div>
              <div className="analytics-microgrid">
                <span>Total: {day.submissions}</span>
                <span>Accepted: {day.accepted}</span>
                <span>Rejected: {day.rejected}</span>
                <span>Docs: {day.docsRequests}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="admin-grid">
        <section className="panel">
          <h3>Recent crawl runs</h3>
          {recentRuns.length > 0 ? (
            <div className="table-list">
              {recentRuns.map((run) => (
                <article className="table-row" key={run.id}>
                  <div className="table-row-header">
                    <strong>{run.trigger}</strong>
                    <span className="badge badge-neutral">
                      {run.indexed}/{run.total} indexed
                    </span>
                  </div>
                  <div className="meta-grid">
                    <span>{new Date(run.ranAt).toLocaleString()}</span>
                    <span>{run.requestedUrls.join(", ")}</span>
                  </div>
                  <ul className="tiny-list">
                    {run.results.slice(0, 4).map((result) => (
                      <li key={`${run.id}:${result.url}`}>
                        <strong>{result.status}</strong> {result.url}
                        {typeof result.pageCount === "number" ? ` (${result.pageCount} pages)` : ""}
                        {result.message ? ` - ${result.message}` : ""}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p>No crawl runs recorded yet.</p>
          )}
        </section>

        <aside className="stack">
          <section className="panel">
            <h3>Recent submissions</h3>
            {recentSubmissions.length > 0 ? (
              <ul className="plain-list">
                {recentSubmissions.map((submission) => (
                  <li key={submission}>
                    <a className="muted-link" href={submission} rel="noreferrer" target="_blank">
                      {submission}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No submitted URLs yet.</p>
            )}
          </section>

          <section className="panel">
            <h3>Recently indexed pages</h3>
            {recentPages.length > 0 ? (
              <ul className="plain-list">
                {recentPages.map((page) => (
                  <li key={page.id}>
                    <strong>{page.title}</strong>
                    <p>{page.siteName}</p>
                    <a className="muted-link" href={page.url} rel="noreferrer" target="_blank">
                      {page.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No indexed pages yet.</p>
            )}
          </section>

          <section className="panel">
            <h3>Docs requests</h3>
            {recentDocsRequests.length > 0 ? (
              <ul className="plain-list">
                {recentDocsRequests.map((request) => (
                  <li key={request.id}>
                    <strong>{request.name}</strong>
                    <p>{request.message}</p>
                    {request.url ? (
                      <a className="muted-link" href={request.url} rel="noreferrer" target="_blank">
                        {request.url}
                      </a>
                    ) : null}
                    {request.email ? <p>{request.email}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No docs requests yet.</p>
            )}
          </section>

          <section className="panel">
            <h3>Why deduping matters</h3>
            <p>
              SEA now removes duplicate pages within a site when the URL normalizes to the same value,
              or when the content fingerprint is effectively identical. That keeps search results tighter.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}