import type { Metadata } from "next";
import Link from "next/link";

import { DocsRequestForm } from "@/components/DocsRequestForm";
import { SubmissionForm } from "@/components/SubmissionForm";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "AISEA Docs: Actions",
  description: "Action-oriented AISEA docs covering site submission, API endpoints, support intake, and next steps.",
  path: "/docs/actions",
});

export default function DocsActionsPage() {
  return (
    <DocsLayout activePage="actions">
      <section className="docs-hero-block" id="submit-site">
        <div className="docs-kicker-row">
          <span className="docs-hero-kicker">Actions</span>
          <span className="docs-hero-chip">Submission and support workflows</span>
        </div>
        <h1>Use the docs surface to submit sites, inspect the API, and hand off support requests.</h1>
        <p className="docs-lead">
          This section groups the operational tasks for AISEA: onboarding a domain, calling the public endpoints, and sending a request when the crawl or robots.txt setup needs review.
        </p>
        <div className="docs-hero-actions">
          <Link className="button" href="#api-reference">Open API reference</Link>
          <Link className="button-ghost" href="#support-feedback">Send a support request</Link>
        </div>
      </section>

      <section className="docs-section">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">Submit a site</span>
          <h2>Request indexing directly from the docs page.</h2>
        </div>
        <div className="docs-embed-card">
          <div className="docs-card-intro">
            <strong>Submission flow</strong>
            <p>Enter a canonical site URL. SEA checks the opt-in and reports whether the domain was indexed or needs robots.txt changes.</p>
          </div>
          <SubmissionForm />
        </div>
      </section>

      <section className="docs-section" id="api-reference">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">API reference</span>
          <h2>Public endpoints for search, submission, crawl triggers, and docs support.</h2>
        </div>
        <div className="docs-api-grid">
          <article className="docs-api-card">
            <div className="docs-api-method">GET</div>
            <h3>/api/search?q=topic</h3>
            <p>Returns JSON search results from the current index.</p>
          </article>
          <article className="docs-api-card">
            <div className="docs-api-method">POST</div>
            <h3>/api/submit</h3>
            <pre>{`{
  "url": "https://example.com"
}`}</pre>
          </article>
          <article className="docs-api-card">
            <div className="docs-api-method">GET</div>
            <h3>/api/crawl</h3>
            <pre>{`/api/crawl
/api/crawl?url=https://example.com`}</pre>
          </article>
          <article className="docs-api-card">
            <div className="docs-api-method">POST</div>
            <h3>/api/docs/request</h3>
            <pre>{`{
  "name": "Your name",
  "email": "optional@example.com",
  "url": "https://example.com",
  "message": "Please review our robots.txt setup"
}`}</pre>
          </article>
        </div>
        <div className="docs-rate-card">
          <strong>Rate limits</strong>
          <p><span className="inline-code">POST /api/submit</span> allows 8 requests per hour. <span className="inline-code">POST /api/docs/request</span> allows 6 requests per hour.</p>
          <p>On limit exhaustion, the API returns <span className="inline-code">429</span> with <span className="inline-code">Retry-After</span> and <span className="inline-code">X-RateLimit-*</span> headers.</p>
        </div>
      </section>

      <section className="docs-section" id="support-feedback">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">Support and feedback</span>
          <h2>Use the docs surface as the handoff point for questions and indexing issues.</h2>
        </div>
        <div className="docs-embed-card docs-support-card">
          <div className="docs-card-intro">
            <strong>Request review</strong>
            <p>Ask for help with robots.txt, crawl behavior, API usage, or onboarding. Requests are stored for follow-up.</p>
          </div>
          <DocsRequestForm />
        </div>
      </section>

      <section className="docs-section" id="where-next">
        <div className="docs-section-header">
          <span className="docs-section-eyebrow">Where to go next</span>
          <h2>Move from overview to action.</h2>
        </div>
        <div className="docs-next-grid">
          <Link className="docs-next-card" href="/docs">
            <strong>Read the overview</strong>
            <span>Start with the framing, capabilities, and quick start path.</span>
          </Link>
          <Link className="docs-next-card" href="/docs/architecture">
            <strong>Study the architecture</strong>
            <span>See the verification and crawl pipeline in more detail.</span>
          </Link>
          <Link className="docs-next-card" href="/faq">
            <strong>Read the FAQ</strong>
            <span>See product questions, search scope, and indexing caveats.</span>
          </Link>
        </div>
      </section>
    </DocsLayout>
  );
}
