import { Lock } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Pitch",
    text: "Tell us the idea in the form below — what it is, who it's for, and how far along you are. Rough is fine. Conviction matters more than polish.",
  },
  {
    n: "02",
    title: "Evaluate",
    text: "We read every submission ourselves. If it's a fit for what we can commit to, we'll reach out to talk it through properly.",
  },
  {
    n: "03",
    title: "Align",
    text: "Before a line of code is written, we agree on scope, roles and ownership in writing — whether that's a paid engagement, a split, or a mix of both.",
  },
  {
    n: "04",
    title: "Build",
    text: "We build it like it's ours too, because by then, it often is. Same craft, same urgency, as everything else we ship.",
  },
];

export function Partnership() {
  return (
    <section id="partnership" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <Reveal>
            <div className="eyebrow flex items-center gap-3 text-xs text-brass">
              <span className="h-px w-8 bg-brass/60" />
              THE PARTNERSHIP MODEL
            </div>
            <h2 className="font-display text-balance mt-6 text-3xl text-paper sm:text-4xl md:text-5xl">
              Got the idea.{" "}
              <span className="italic text-brass-bright">
                Not a dev team?
              </span>
            </h2>
            <p className="mt-6 max-w-md text-balance text-[15px] leading-relaxed text-paper-dim sm:text-base">
              For ideas we believe in, we&rsquo;ll put in design and
              engineering time in exchange for a share of the thing we build
              — not instead of your vision, but alongside it. You stay the
              founder. We become the partner who actually ships it.
            </p>

            <div className="mt-10 flex items-start gap-3 rounded-xl border border-burgundy-bright/30 bg-burgundy/10 p-5">
              <Lock size={17} className="mt-0.5 shrink-0 text-burgundy-bright" />
              <p className="text-sm leading-relaxed text-paper-dim">
                Every idea you send us is treated as confidential. We never
                build, discuss or shop your idea without your agreement —
                happy to sign an NDA before a deeper conversation.
              </p>
            </div>
          </Reveal>

          <div className="flex flex-col">
            <div className="pinstripe" />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05}>
                <div className="flex items-start gap-6 py-8 sm:gap-8">
                  <span className="pit-badge flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brass/50 text-sm text-brass sm:h-14 sm:w-14 sm:text-base">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-display text-lg text-paper sm:text-xl">
                      {s.title}
                    </h3>
                    <p className="mt-2 max-w-md text-[15px] leading-relaxed text-paper-dim">
                      {s.text}
                    </p>
                  </div>
                </div>
                <div className="pinstripe" />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
