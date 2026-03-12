import type { Metadata } from "next";
import Link from "next/link";

import { DocsLayout } from "@/components/docs/DocsLayout";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

const capabilities = [
  {
    title: "Publish the opt-in",
    body: "Add the AI opt-in directive to robots.txt so SEA can verify that the site wants to be included in AI-first search.",
    badge: "Available now",
  },
  {
    title: "Submit and validate",
    body: "Send a domain through the UI or API. SEA checks robots.txt, canonical metadata, and reachability before indexing.",
    badge: "Self-serve",
  },
  {
    title: "Trigger focused crawls",
    body: "Run a seed-wide crawl or a single-site crawl when you need to refresh results after publishing new pages.",
    badge: "Operator flow",
  },
];

export const metadata: Metadata = createPageMetadata({
  title: "AISEA Docs: Overview",
  description: "Overview documentation for AISEA covering product framing, quick start, and current indexing capabilities.",
  path: "/docs",
});

export default function DocsOverviewPage() {
  return (
    <DocsLayout activePage="overview">
      <section className="docs-hero-block" id="what-is-aisea">
        <div className="docs-kicker-row">
          <span className="docs-hero-kicker">Overview</span>
          <span className="docs-hero-chip">Operator documentation</span>
        </div>
        <h1>AISEA is the operator surface for an opt-in AI search index.</h1>
        <p className="docs-lead">
          SEA only indexes domains that explicitly declare they want to be discovered in AI-oriented search.
          This overview covers the product framing, the quick start path, and the capabilities available in the current build.
        </p>
        <div className="docs-hero-actions">
          <Link className="button" href="#quick-start">Read the quick start</Link>
          <Link className="button-ghost" href="/docs/actions">Open actions</Link>
        </div>
        <div className="docs-hero-metrics">
          <div>
            <strong>3 docs pages</strong>
            <span>Overview, architecture, and actions.</span>
          </div>
          <div>
            <strong>Opt-in only</strong>
            <span>robots.txt drives eligibility.</span>
          </div>
          <div>
            <strong>Direct support</strong>
            <span>Requests are captured from the docs surface.</span>
          </div>
        </div>
      </section>

      <section className="docs-section" id="what-you-can-do">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">What you can do today</span>
          <h2>From publisher onboarding to crawl operations.</h2>
        </div>
        <div className="docs-capability-grid">
          {capabilities.map((item) => (
            <article className="docs-capability-card" key={item.title}>
              <span className="docs-capability-badge">{item.badge}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="docs-section" id="quick-start">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">Quick start</span>
          <h2>Publish the directive, submit the domain, and let SEA do the verification.</h2>
        </div>
        <div className="docs-two-column-callout">
          <div className="docs-steps-card">
            <ol className="docs-step-list">
              <li>
                <strong>Add the opt-in directive</strong>
                <p>SEA expects a robots.txt marker before it will include pages in the index.</p>
              </li>
              <li>
                <strong>Submit your root URL</strong>
                <p>Use the submit API or the actions page to kick off verification.</p>
              </li>
              <li>
                <strong>Review crawl output</strong>
                <p>Eligible pages are summarized and stored for search. Re-run crawls when your content changes.</p>
              </li>
            </ol>
          </div>
          <div className="docs-code-card">
            <div className="docs-code-label">Recommended robots.txt fragment</div>
            <pre>{`ai-generated: true
ai-generated-by: Claude
ai-generated-date: YYYY-MM-DD`}</pre>
          </div>
        </div>
      </section>

      <section className="docs-section">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">Continue reading</span>
          <h2>Move from overview into system detail or day-to-day actions.</h2>
        </div>
        <div className="docs-next-grid">
          <Link className="docs-next-card" href="/docs/architecture">
            <strong>Open architecture</strong>
            <span>See the verification path, crawl lifecycle, and glossary.</span>
          </Link>
          <Link className="docs-next-card" href="/docs/actions">
            <strong>Open actions</strong>
            <span>Submit a site, inspect the API, and send support requests.</span>
          </Link>
          <Link className="docs-next-card" href="/about">
            <strong>Read product background</strong>
            <span>See the positioning and philosophy behind the opt-in model.</span>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}