import Link from "next/link";

import { BrandLink } from "@/components/Brand";
import { SubmissionForm } from "@/components/SubmissionForm";

export const dynamic = "force-dynamic";

export default function SubmitPage() {
  return (
    <main className="shell submit-shell">
      <nav className="nav">
        <BrandLink href="/" label="Search Engine for AI Generated Content" />
        <div className="nav-links">
          <Link href="/">Search</Link>
          <Link href="/about">About</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/index">Get indexed</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">Submit a site</span>
        <h1>Request indexing in one step.</h1>
        <p>
          Enter a site URL. SEA checks robots.txt, verifies the opt-in directive,
          and adds the site to the index if it qualifies.
        </p>
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <h3>Submit for indexing</h3>
        <p>
          If the directive is missing, SEA shows the exact snippet to add before you resubmit.
        </p>
        <div style={{ marginTop: 16 }}>
          <SubmissionForm />
        </div>
      </section>
    </main>
  );
}