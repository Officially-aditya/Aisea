import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLink } from "@/components/Brand";

type DocsPage = "overview" | "architecture" | "actions";

type DocsLayoutProps = {
  activePage: DocsPage;
  children: ReactNode;
};

const docsNavigation = [
  {
    key: "overview" as const,
    title: "Overview",
    href: "/docs",
    description: "Product framing, quick start, and current capabilities.",
    sections: [
      { href: "/docs#what-is-aisea", label: "What is AISEA?" },
      { href: "/docs#what-you-can-do", label: "What you can do today" },
      { href: "/docs#quick-start", label: "Quick start" },
    ],
  },
  {
    key: "architecture" as const,
    title: "Architecture",
    href: "/docs/architecture",
    description: "Verification, crawl lifecycle, glossary, and system rationale.",
    sections: [
      { href: "/docs/architecture#how-it-works", label: "How AISEA runs indexing" },
      { href: "/docs/architecture#glossary", label: "Glossary" },
      { href: "/docs/architecture#why-build", label: "Why use AISEA?" },
    ],
  },
  {
    key: "actions" as const,
    title: "Actions",
    href: "/docs/actions",
    description: "Submission, API reference, support intake, and next steps.",
    sections: [
      { href: "/docs/actions#submit-site", label: "Submit a site" },
      { href: "/docs/actions#api-reference", label: "API reference" },
      { href: "/docs/actions#support-feedback", label: "Support and feedback" },
      { href: "/docs/actions#where-next", label: "Where to go next" },
    ],
  },
];

export function DocsLayout({ activePage, children }: DocsLayoutProps) {
  return (
    <main className="docs-shell">
      <div className="docs-announcement">
        <span className="docs-announcement-label">AISEA docs</span>
        <p>The indexing workflow is live. Publish the opt-in, submit your domain, and trigger crawls from one operator-facing reference.</p>
        <Link className="docs-announcement-link" href="/index">Start indexing</Link>
      </div>

      <header className="docs-topbar">
        <div className="docs-topbar-inner">
          <BrandLink href="/docs" label="AISEA Docs" />
          <Link aria-label="Search SEA" className="docs-search-shell" href="/">
            <span className="docs-search-text">Search docs, APIs, and flows</span>
            <span className="docs-keycap">⌘K</span>
          </Link>
          <nav className="docs-toplinks">
            <Link href="/">Search</Link>
            <Link href="/about">About</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/admin" prefetch={false}>Admin</Link>
          </nav>
        </div>
      </header>

      <div className="docs-grid">
        <aside className="docs-sidebar-nav">
          <div className="docs-sidebar-card">
            <span className="docs-sidebar-heading">Documentation</span>
            {docsNavigation.map((group) => {
              const isActive = group.key === activePage;

              return (
                <div className="docs-sidebar-section" key={group.key}>
                  <Link
                    className={isActive ? "docs-sidebar-page-link docs-sidebar-page-link-active" : "docs-sidebar-page-link"}
                    href={group.href}
                  >
                    {group.title}
                  </Link>
                  <p className="docs-sidebar-page-copy">{group.description}</p>
                  {group.sections.map((link) => (
                    <Link href={link.href} key={link.href}>{link.label}</Link>
                  ))}
                </div>
              );
            })}
          </div>
        </aside>

        <article className="docs-article">{children}</article>
      </div>
    </main>
  );
}
