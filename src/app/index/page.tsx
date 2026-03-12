import type { Metadata } from "next";
import Link from "next/link";

import { BrandLink } from "@/components/Brand";
import { SubmissionForm } from "@/components/SubmissionForm";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Get Indexed on AISEA",
  description: "Submit your site to AISEA by adding the AI-generated robots.txt directive and requesting indexing.",
  path: "/index",
});

export default function IndexLandingPage() {
  return (
    <main className="shell">
      <nav className="nav">
        <BrandLink href="/" label="Search Engine for AI Generated Content" />
        <div className="nav-links">
          <Link href="/about">About</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/submit">Submit</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">Get Indexed</span>
        <h1>Publish the directive. Submit the URL. Appear in SEA.</h1>
        <p>
          This page is the focused public onboarding route for publishers. Add the opt-in line to robots.txt,
          submit the site, and SEA will verify and crawl it if eligible.
        </p>
        <div className="hero-actions">
          <a className="button" href="#submit-form">Submit now</a>
          <Link className="button-ghost" href="/about">What is AISEA?</Link>
          <Link className="button-ghost" href="/docs">Read the docs</Link>
        </div>
      </section>

      <div className="layout-grid">
        <section className="results-column">
          <section className="panel docs-panel">
            <h3>Step 1: Update robots.txt</h3>
            <p>Add the SEA directive to the site root robots.txt file.</p>
            <pre>{`ai-generated: true
ai-generated-by: Claude
ai-generated-date: YYYY-MM-DD`}</pre>
          </section>

          <section className="panel docs-panel" id="submit-form">
            <h3>Step 2: Submit your URL</h3>
            <p>
              SEA checks your robots.txt, crawls the site if it is opted in, and adds pages to the search index.
            </p>
            <div style={{ marginTop: 16 }}>
              <SubmissionForm />
            </div>
          </section>
        </section>

        <aside className="sidebar">
          <section className="panel docs-panel">
            <h3>What SEA stores</h3>
            <ul className="docs-list compact-list">
              <li>Site name and canonical URL</li>
              <li>Page title and description</li>
              <li>Short content summary</li>
              <li>Opt-in metadata from robots.txt</li>
            </ul>
          </section>

          <section className="panel docs-panel">
            <h3>Need the API instead?</h3>
            <p>Send a POST request to the submit endpoint.</p>
            <pre>{`curl -X POST 'https://aisea.in/api/submit' \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com"}'`}</pre>
          </section>
        </aside>
      </div>
    </main>
  );
}