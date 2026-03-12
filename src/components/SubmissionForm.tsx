"use client";

import { useState } from "react";

type SubmissionResponse =
  | {
      status: "indexed";
      site: {
        title: string;
        hostname: string;
      };
      pageCount: number;
      robotsUrl: string;
    }
  | {
      status: "not-opted-in";
      instructions: string;
      robotsUrl: string;
      suggestedSnippet: string;
    }
  | {
      status: "error";
      message: string;
      robotsUrl?: string;
    }
  | {
      error: string;
    };

export function SubmissionForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmissionResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const payload = (await response.json()) as SubmissionResponse;
      setResult(payload);
    } catch {
      setResult({
        status: "error",
        message: "Submission failed. Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <form className="submit-form" onSubmit={handleSubmit}>
        <input
          name="url"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://your-site.example"
          required
          type="url"
          value={url}
        />
        <button className="button" disabled={loading} type="submit">
          {loading ? "Checking robots.txt..." : "Submit for indexing"}
        </button>
      </form>

      {result && "error" in result ? (
        <div className="submit-result">
          <strong className="status-warn">{result.error}</strong>
        </div>
      ) : null}

      {result && "status" in result && result.status === "indexed" ? (
        <div className="submit-result">
          <strong className="status-good">Indexed successfully</strong>
          <p>
            {result.site.title} from {result.site.hostname} is now in SEA with {result.pageCount} indexed pages.
          </p>
          <p>
            robots.txt: <a href={result.robotsUrl}>{result.robotsUrl}</a>
          </p>
        </div>
      ) : null}

      {result && "status" in result && result.status === "not-opted-in" ? (
        <div className="submit-result">
          <strong className="status-warn">robots.txt is missing the opt-in</strong>
          <p>{result.instructions}</p>
          <p>
            robots.txt: <a href={result.robotsUrl}>{result.robotsUrl}</a>
          </p>
          <pre>{result.suggestedSnippet}</pre>
        </div>
      ) : null}

      {result && "status" in result && result.status === "error" ? (
        <div className="submit-result">
          <strong className="status-warn">Submission failed</strong>
          <p>{result.message}</p>
          {result.robotsUrl ? (
            <p>
              robots.txt: <a href={result.robotsUrl}>{result.robotsUrl}</a>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}