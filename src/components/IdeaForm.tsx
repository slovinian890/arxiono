"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Reveal } from "./Reveal";

type Status = "idle" | "loading" | "success" | "error";

const fieldClass =
  "w-full border-0 border-b border-surface-line bg-transparent px-0.5 pb-2.5 pt-1 text-sm text-paper placeholder:text-muted/50 transition-colors focus:border-brass focus:outline-none";

const boxClass =
  "w-full rounded-md border border-surface-line/80 bg-transparent px-4 py-3 text-sm text-paper placeholder:text-muted/50 transition-colors focus:border-brass focus:outline-none";

export function IdeaForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/submit-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-racing-glow/30 bg-surface/50 px-8 py-20 text-center">
        <CheckCircle2 size={40} className="text-racing-glow" strokeWidth={1.3} />
        <h3 className="font-display text-2xl text-paper">
          Got it — thank you.
        </h3>
        <p className="max-w-sm text-sm text-paper-dim">
          We read every submission personally. If there&rsquo;s a fit,
          we&rsquo;ll be in touch at the email address you gave us.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-2 text-sm text-brass underline underline-offset-4 hover:text-paper"
        >
          Send another idea
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-2xl border border-surface-line/80 bg-surface/40 p-6 sm:p-9"
    >
      <div className="relative mb-7 flex items-center justify-between border-b border-dashed border-surface-line pb-5">
        <span className="eyebrow text-[11px] text-brass">Entry form</span>
        <span className="pit-badge text-[11px] text-muted">No. 001</span>
        <span className="absolute -left-6 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-surface-line bg-bg sm:-left-9" />
        <span className="absolute -right-6 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-surface-line bg-bg sm:-right-9" />
      </div>

      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs tracking-wide text-paper-dim">
              Your name
            </label>
            <input required name="name" type="text" className={fieldClass} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="mb-2 block text-xs tracking-wide text-paper-dim">
              Email
            </label>
            <input
              required
              name="email"
              type="email"
              className={fieldClass}
              placeholder="jane@email.com"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs tracking-wide text-paper-dim">
            Idea name
          </label>
          <input
            required
            name="ideaTitle"
            type="text"
            className={fieldClass}
            placeholder="What do you call it?"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs tracking-wide text-paper-dim">
            Describe your idea
          </label>
          <textarea
            required
            name="description"
            rows={6}
            className={`${boxClass} resize-none`}
            placeholder="What is it, who's it for, and why does it need to exist? Rough is fine — conviction matters more than polish."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs tracking-wide text-paper-dim">
              Where is it today?
            </label>
            <select name="stage" className={`${boxClass} pr-9`} defaultValue="concept">
              <option value="concept">Just a concept</option>
              <option value="prototype">Have a prototype / designs</option>
              <option value="existing">Have an existing app</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs tracking-wide text-paper-dim">
              Link (optional)
            </label>
            <input
              name="link"
              type="url"
              className={fieldClass}
              placeholder="Deck, prototype, anything useful"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 pt-1 text-sm text-paper-dim">
          <input
            type="checkbox"
            name="openToSplit"
            value="yes"
            defaultChecked
            className="mt-1 h-4 w-4 shrink-0 rounded border-surface-line bg-transparent accent-racing-bright"
          />
          I&rsquo;m open to discussing a shared-ownership partnership, not only
          a paid engagement.
        </label>

        {status === "error" && (
          <div className="flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-plate group mt-2 inline-flex items-center justify-center gap-2 bg-racing-bright text-paper hover:bg-racing-glow hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Send my idea"}
          {status !== "loading" && (
            <Send size={15} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </button>

        <p className="text-center text-xs text-muted">
          Confidential by default. No contract, no obligation — this just
          starts the conversation.
        </p>
      </div>
    </form>
  );
}

export function IdeaFormSection() {
  return (
    <section id="pitch" className="relative border-t border-surface-line/60 py-28 sm:py-36">
      <div className="mx-auto max-w-3xl px-6 sm:px-10">
        <Reveal className="text-center">
          <div className="eyebrow flex items-center justify-center gap-3 text-xs text-brass">
            <span className="h-px w-8 bg-brass/60" />
            PITCH YOUR IDEA
            <span className="h-px w-8 bg-brass/60" />
          </div>
          <h2 className="font-display text-balance mx-auto mt-6 max-w-xl text-3xl text-paper sm:text-4xl md:text-5xl">
            Tell us the idea you can&rsquo;t stop thinking about.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-14">
          <IdeaForm />
        </Reveal>
      </div>
    </section>
  );
}
