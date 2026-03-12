import type { Metadata } from "next";
import Link from "next/link";

import { BrandLink } from "@/components/Brand";
import { createPageMetadata } from "@/lib/metadata";
import { readDatabase } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "About AISEA",
  description: "Learn what AISEA is, how opt-in indexing works, the robots.txt standard, and which sites are currently in the index.",
  path: "/about",
});

export default async function AboutPage() {
  const database = await readDatabase();

  return (
    <main className="shell">
      <nav className="nav">
        <BrandLink href="/" label="Search Engine for AI Generated Content" />
        <div className="nav-links">
          <Link href="/about">About</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/index">Get indexed</Link>
          <Link href="/submit">Submit</Link>
          <Link href="/admin" prefetch={false}>Admin</Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">About</span>
        <div className="about-toast" role="status">
          <span className="about-toast-dot" />
          <span>Zeno</span>
        </div>
        <h1>Search sites that explicitly publish AI-generated work.</h1>
        <p>
          AISEA checks for a dedicated robots.txt directive, indexes sites that opt in,
          and makes those pages searchable without trying to crawl the entire web. It is an intentionally narrow search engine.
        </p>
      </section>

      <div className="layout-grid">
        <section className="results-column">
          <section className="panel docs-panel">
            <h3>What AISEA does</h3>
            <p>
              AISEA is built for publishers who want AI-generated or AI-assisted work to be discoverable on explicit terms.
              Instead of indexing everything by default, it waits for a clear opt-in signal.
            </p>
            <p>
              If the opt-in is present, AISEA indexes page title, description, canonical URL, and a short content summary.
            </p>
          </section>

          <section className="panel docs-panel">
            <h3>robots.txt standard</h3>
            <p>The only required field is the first line.</p>
            <pre>{`ai-generated: true
ai-generated-by: Claude
ai-generated-date: YYYY-MM-DD`}</pre>
          </section>
        </section>

        <aside className="sidebar">
          <section className="panel">
            <h3>Seed list</h3>
            <ul className="site-list">
              {database.seeds.map((seed) => (
                <li key={seed}>
                  <a href={seed} rel="noreferrer" target="_blank">
                    <strong>{new URL(seed).hostname}</strong>
                    <span>{seed}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h3>Recently indexed</h3>
            {database.sites.length > 0 ? (
              <ul className="plain-list">
                {database.sites.slice(0, 5).map((site) => (
                  <li key={site.id}>
                    <strong>{site.title}</strong>
                    <p>{site.pageCount} pages indexed from {site.hostname}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No sites are indexed yet.</p>
            )}
          </section>

          <section className="panel docs-panel">
            <h3>Next steps</h3>
            <div className="panel-actions">
              <Link className="button" href="/index">Get indexed</Link>
              <Link className="button-ghost" href="/docs">Read docs</Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}