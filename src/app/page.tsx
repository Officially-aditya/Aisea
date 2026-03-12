import { BrandLink } from "@/components/Brand";
import Link from "next/link";
import { readDatabase, searchPages } from "@/lib/storage";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function normalizeSnippet(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function isStructuredDataSnippet(value: string) {
  const normalized = normalizeSnippet(value);

  return normalized.startsWith('{"@context"') || normalized.includes("https://schema.org") || normalized.includes('"@type"');
}

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() ?? "";
  const database = await readDatabase();
  const results = searchPages(database.pages, query).slice(0, 24);

  return (
    <main className="shell shell-minimal">
      <BrandLink className="brand-home" href="/" label="AISEA" />

      <section className="search-panel search-panel-minimal">
        <form action="/" className="search-form">
          <input
            aria-label="Search indexed AI generated pages"
            defaultValue={query}
            name="q"
            placeholder="Search AI"
            type="search"
          />
          <button className="button" type="submit">
            Search
          </button>
        </form>
      </section>

      {query ? (
        <section className="results-column results-column-minimal">
          <p className="search-meta search-meta-minimal">
            {results.length} results across {database.sites.length} sites and {database.pages.length} indexed pages.
          </p>
          {results.length > 0 ? (
            results.map((page) => {
              const normalizedDescription = normalizeSnippet(page.description);
              const normalizedSummary = normalizeSnippet(page.summary);
              const showDescription = Boolean(page.description);
              const showSummary = Boolean(page.summary)
                && normalizedSummary !== normalizedDescription
                && !isStructuredDataSnippet(page.summary);

              return (
                <article className="panel result-card" key={page.id}>
                  <div className="row">
                    <span className="badge">AI Generated</span>
                    <span className="badge badge-neutral">{page.siteName}</span>
                  </div>
                  <h2>
                    <a href={page.url} rel="noreferrer" target="_blank">
                      {page.title}
                    </a>
                  </h2>
                  {showDescription ? (
                    <p className="result-meta">{page.description}</p>
                  ) : (
                    <p className="result-meta">No description provided.</p>
                  )}
                  <a className="result-url" href={page.url} rel="noreferrer" target="_blank">
                    {page.url}
                  </a>
                  {showSummary ? <p className="result-summary">{page.summary}</p> : null}
                </article>
              );
            })
          ) : (
            <article className="panel empty-state">
              <h2>No matches yet</h2>
              <p className="status-note">
                Try a broader search or come back after more sites are indexed.
              </p>
            </article>
          )}
        </section>
      ) : null}

      <footer className="home-footer">
        <span>AISEA</span>
        <Link href="/docs">Docs</Link>
        <Link href="/about">About</Link>
        <Link href="/faq">FAQ</Link>
      </footer>
    </main>
  );
}
