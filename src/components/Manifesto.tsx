import { Reveal } from "./Reveal";

const CHAPTERS = [
  {
    n: "I",
    title: "The spark",
    text: "Every app we've ever touched started the same way — not in a boardroom, but in someone's head, at an hour too late to be reasonable. A problem they couldn't stop turning over. We built Arxiono for that person.",
  },
  {
    n: "II",
    title: "The craft",
    text: "We're a small, senior team — not an agency with a sales layer between you and the people writing code. Native iOS and Android, built properly, reviewed carefully, shipped without the shortcuts that come back to bite you in year two.",
  },
  {
    n: "III",
    title: "The partnership",
    text: "Most studios charge by the hour and walk away. We'd rather build alongside you — and for ideas we believe in, that can mean trading some of our time for a stake in what we build together.",
  },
  {
    n: "IV",
    title: "The launch — and after",
    text: "Shipping to the App Store is the beginning of the real feedback loop, not the finish line. We stay close through the first releases, the first reviews, the first hard decisions about what to build next.",
  },
];

export function Manifesto() {
  return (
    <section id="story" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <Reveal>
          <div className="eyebrow flex items-center gap-3 text-xs text-brass">
            <span className="h-px w-8 bg-brass/60" />
            OUR STORY
          </div>
          <h2 className="font-display text-balance mt-6 max-w-2xl text-3xl text-paper sm:text-4xl md:text-5xl">
            A studio built around one belief: the idea matters more than the
            org chart.
          </h2>
        </Reveal>

        <div className="mt-20 flex flex-col">
          <div className="pinstripe" />
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.n} delay={i * 0.05}>
              <div className="grid grid-cols-[auto_1fr] gap-6 py-10 sm:grid-cols-[120px_1fr] sm:gap-10">
                <div className="flex items-start gap-4 sm:block">
                  <span className="pit-badge flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brass/50 text-lg text-brass sm:h-16 sm:w-16 sm:text-xl">
                    {c.n}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl text-paper sm:text-2xl">
                    {c.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-balance text-[15px] leading-relaxed text-paper-dim sm:text-base">
                    {c.text}
                  </p>
                </div>
              </div>
              <div className="pinstripe" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
