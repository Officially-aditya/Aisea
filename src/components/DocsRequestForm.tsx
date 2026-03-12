"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  url: string;
  message: string;
};

export function DocsRequestForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    url: "",
    message: "",
  });
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/docs/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save the request.");
      }

      setForm({ name: "", email: "", url: "", message: "" });
      setStatus(payload.message ?? "Saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save the request.");
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <div className="stack">
      <form className="submit-form" onSubmit={handleSubmit}>
        <input
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Your name"
          required
          type="text"
          value={form.name}
        />
        <input
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="Email (optional)"
          type="email"
          value={form.email}
        />
        <input
          onChange={(event) => updateField("url", event.target.value)}
          placeholder="Site URL (optional)"
          type="url"
          value={form.url}
        />
        <textarea
          className="textarea"
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="What do you need help with?"
          required
          rows={5}
          value={form.message}
        />
        <button className="button" disabled={loading} type="submit">
          {loading ? "Saving..." : "Send request"}
        </button>
      </form>
      {status ? <p className="microcopy">{status}</p> : null}
    </div>
  );
}