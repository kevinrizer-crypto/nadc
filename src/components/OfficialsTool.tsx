"use client";

import { useState } from "react";
import { LETTER_TEMPLATES } from "@/lib/letters";

type Official = { name: string; role: string; level: string; party?: string; contactUrl?: string; phone?: string };
type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; officials: Official[]; location: { city?: string; state?: string; zip?: string } };

export default function OfficialsTool() {
  const [address, setAddress] = useState("");
  const [state, setState] = useState<LookupState>({ kind: "idle" });
  const [templateId, setTemplateId] = useState<string>(LETTER_TEMPLATES[0].id);
  const [letter, setLetter] = useState<string>(LETTER_TEMPLATES[0].body);
  const [subject, setSubject] = useState<string>(LETTER_TEMPLATES[0].subject);
  const [copied, setCopied] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/officials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed.");
      setState({ kind: "ok", officials: data.officials, location: data.location });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Lookup failed." });
    }
  }

  function pickTemplate(id: string) {
    const t = LETTER_TEMPLATES.find((t) => t.id === id)!;
    setTemplateId(id);
    setSubject(t.subject);
    setLetter(t.body);
  }

  async function copyLetter() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${letter}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={lookup} className="card p-6" aria-label="Find your representatives">
        <label className="block mb-3">
          <span className="label">Your street address</span>
          <input
            type="text"
            required
            className="input"
            placeholder="123 Main St, Griffin, GA 30223"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
        </label>
        <button type="submit" className="btn-primary" disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Looking up…" : "Find my representatives"}
        </button>
        {state.kind === "error" && (
          <p className="font-body text-sm text-accent-dark mt-3" role="alert">
            {state.message}
          </p>
        )}
      </form>

      {state.kind === "ok" && (
        <section aria-label="Your representatives">
          <h2 className="font-display text-2xl text-primary mb-4">
            Your representatives{state.location.city ? ` — ${state.location.city}, ${state.location.state}` : ""}
          </h2>
          {state.officials.length === 0 ? (
            <p className="font-body text-sm text-slate-500">
              No matches found for that address. Double-check it, or look up your officials directly via your state
              legislature&apos;s website.
            </p>
          ) : (
            <ul className="card divide-y divide-[#EEEEEE]">
              {state.officials.map((o, i) => (
                <li key={i} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-body font-semibold text-sm text-ink">
                      {o.name}
                      {o.party ? <span className="text-slate-400 font-normal"> ({o.party})</span> : null}
                    </p>
                    <p className="font-body text-xs text-slate-500">{o.role}</p>
                  </div>
                  <p className="font-mono text-xs space-x-3">
                    {o.phone && <span className="text-slate-500">{o.phone}</span>}
                    {o.contactUrl && (
                      <a href={o.contactUrl} className="text-primary underline" rel="noopener" target="_blank">
                        contact form ↗
                      </a>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-label="Letter template" className="card p-6">
        <h2 className="font-display text-2xl text-primary mb-4">Your letter</h2>
        <div role="group" aria-label="Choose a template" className="flex flex-wrap gap-2 mb-4">
          {LETTER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={templateId === t.id}
              onClick={() => pickTemplate(t.id)}
              className={`px-3 py-2 font-body text-xs font-medium rounded-sm border ${
                templateId === t.id
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-600 border-[#CCCCCC] hover:border-primary/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="block mb-3">
          <span className="label">Subject</span>
          <input type="text" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="block mb-4">
          <span className="label">Body — replace the [BRACKETED] placeholders with your details</span>
          <textarea rows={16} className="input font-mono text-xs" value={letter} onChange={(e) => setLetter(e.target.value)} />
        </label>
        <button type="button" className="btn-primary" onClick={copyLetter}>
          {copied ? "Copied ✓" : "Copy letter"}
        </button>
        <p className="font-body text-xs text-slate-400 mt-3">
          Paste it into your representative&apos;s contact form, or print and mail it. Personalized letters carry more
          weight than identical form blasts — edit freely.
        </p>
      </section>
    </div>
  );
}
