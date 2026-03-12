import type { Metadata } from "next";
import Link from "next/link";

import { BrandLink } from "@/components/Brand";
import { filterFaqSections } from "@/lib/faq";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "AISEA FAQ",
  description: "Frequently asked questions about AISEA, how it differs from Google, and how AI-generated sites get indexed.",
  path: "/faq",
});

type FaqPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function FaqPage({ searchParams }: FaqPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() ?? "";
  const sections = filterFaqSections(query);

  return (
    <main className="shell">
      <nav className="nav">
        <BrandLink href="/" label="Search Engine for AI Generated Content" />
        <div className="nav-links">
          <Link href="/">Search</Link>
          <Link href="/about">About</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/index">Get indexed</Link>
          <Link href="/submit">Submit</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">FAQ</span>
        <h1>Common questions about AISEA.</h1>
        <p>
          This page answers the product questions people are likely to ask first: what AISEA is,
          how it differs from Google, what an AI search engine means here, and how sites get indexed.
        </p>
        <div className="hero-actions">
          <Link className="button-ghost" href="/about">About AISEA</Link>
          <Link className="button" href="/docs">Read the docs</Link>
          <Link className="button-ghost" href="/index">Submit your site</Link>
        </div>
      </section>

      <section className="search-panel">
        <form action="/faq" className="search-form">
          <input
            aria-label="Search FAQ questions"
            defaultValue={query}
            name="q"
            placeholder="Search questions like: google, submit, robots"
            type="search"
          />
          <button className="button" type="submit">
            Search FAQ
          </button>
        </form>
        <p className="search-meta">
          {sections.reduce((count, section) => count + section.items.length, 0)} questions matched.
        </p>
      </section>

      <div className="layout-grid">
        <section className="results-column">
          {sections.length > 0 ? (
            sections.map((section) => (
              <section className="panel docs-panel" key={section.title}>
                <h3>{section.title}</h3>
                <div className="faq-list faq-large">
                  {section.items.map((item) => (
                    <article key={item.question}>
                      <strong>{item.question}</strong>
                      <p>{item.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section className="panel docs-panel">
              <h3>No matching questions</h3>
              <p>Try a broader keyword like search, google, robots, submit, or admin.</p>
            </section>
          )}
        </section>

        <aside className="sidebar">
          <section className="panel docs-panel">
            <h3>Start here</h3>
            <ul className="docs-list compact-list">
              <li><Link href="/docs">Documentation and API reference</Link></li>
              <li><Link href="/index">Submit a site for indexing</Link></li>
              <li><Link href="/submit">Direct submission form</Link></li>
            </ul>
          </section>

          <section className="panel docs-panel">
            <h3>Short answer</h3>
            <p>
              AISEA is not trying to index everything. It is a curated, opt-in search engine for AI-generated publishing.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}