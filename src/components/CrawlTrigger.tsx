"use client";

import { useState } from "react";

type CrawlState = {
  loading: boolean;
  message: string;
};

export function CrawlTrigger() {
  const [state, setState] = useState<CrawlState>({ loading: false, message: "" });

  async function handleClick() {
    setState({ loading: true, message: "Refreshing the seed index..." });

    try {
      const response = await fetch("/api/crawl", { method: "POST" });
      const payload = (await response.json()) as { indexed?: number; total?: number };

      if (!response.ok) {
        throw new Error("The crawler could not run.");
      }

      setState({
        loading: false,
        message: `Indexed ${payload.indexed ?? 0} of ${payload.total ?? 0} seed sites.`,
      });
    } catch {
      setState({ loading: false, message: "Crawler failed. Check the API response for details." });
    }
  }

  return (
    <div className="stack">
      <button className="button-secondary" disabled={state.loading} onClick={handleClick} type="button">
        {state.loading ? "Running crawler..." : "Run crawler now"}
      </button>
      {state.message ? <p className="microcopy">{state.message}</p> : null}
    </div>
  );
}