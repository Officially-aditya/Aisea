import type { Metadata } from "next";

import { DocsLayout } from "@/components/docs/DocsLayout";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

const lifecycleSteps = [
  {
    title: "Verification",
    body: "SEA starts at robots.txt, confirms the opt-in directive, and captures any AI metadata attached to the domain.",
  },
  {
    title: "Page discovery",
    body: "The crawler walks a constrained set of HTML pages, normalizes URLs, and extracts titles, descriptions, and summaries.",
  },
  {
    title: "Serving",
    body: "Accepted pages are written into the local JSON index and become searchable through the site and public search endpoint.",
  },
];

const glossaryItems = [
  ["Site", "A domain that has opted in and passed verification."],
  ["Page", "A crawled HTML document stored in the searchable index."],
  ["Seed crawl", "A broader crawl job that refreshes known sources."],
  ["Single crawl", "An on-demand crawl for one submitted URL."],
  ["AI metadata", "Optional fields from robots.txt such as generator and date."],
  ["Support request", "A docs-originated message stored for follow-up review."],
] as const;

const reasons = [
  "Explicit opt-in keeps the index aligned with publisher intent instead of scraping the open web.",
  "The workflow is small enough to understand end-to-end, so operators can debug ingestion without opaque ranking systems.",
  "The crawler model is deterministic enough to reason about during local development and production operations.",
  "Metadata extraction and summary generation are intentionally narrow so the index stays legible and inspectable.",
];

export const metadata: Metadata = createPageMetadata({
  title: "AISEA Docs: Architecture",
  description: "Architecture notes for AISEA covering verification, crawl lifecycle, storage concepts, and indexing rationale.",
  path: "/docs/architecture",
});

export default function DocsArchitecturePage() {
  return (
    <DocsLayout activePage="architecture">
      <section className="docs-hero-block" id="how-it-works">
        <div className="docs-kicker-row">
          <span className="docs-hero-kicker">Architecture</span>
          <span className="docs-hero-chip">Verification and crawl model</span>
        </div>
        <h1>AISEA uses a narrow indexing pipeline that stays auditable from input to search result.</h1>
        <p className="docs-lead">
          The system only accepts explicit opt-in domains, crawls a limited page set, and writes a compact index that can be inspected locally.
          This page covers the verification path, the crawl lifecycle, and the core product vocabulary.
        </p>
      </section>

      <section className="docs-section">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">How AISEA runs indexing</span>
          <h2>The system is intentionally narrow: verify, crawl, summarize, serve.</h2>
        </div>
        <div className="docs-timeline">
          {lifecycleSteps.map((step, index) => (
            <article className="docs-timeline-item" key={step.title}>
              <span className="docs-timeline-index">0{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="docs-note-card">
          <strong>Why this model matters</strong>
          <p>
            SEA is not trying to mirror a general search engine. The point is to make discovery auditable and explicit for sites that want their AI-generated material indexed.
          </p>
        </div>
      </section>

      <section className="docs-section" id="glossary">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">Glossary</span>
          <h2>Building blocks of the current product.</h2>
        </div>
        <div className="docs-glossary-table">
          {glossaryItems.map(([term, definition]) => (
            <div className="docs-glossary-row" key={term}>
              <strong>{term}</strong>
              <span>{definition}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="docs-section" id="why-build">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">Why use AISEA?</span>
          <h2>It gives AI publishers a constrained, inspectable ingestion path.</h2>
        </div>
        <div className="docs-reason-grid">
          {reasons.map((reason) => (
            <article className="docs-reason-card" key={reason}>
              <p>{reason}</p>
            </article>
          ))}
        </div>
      </section>
    </DocsLayout>
  );
}
