import { Reveal } from "./Reveal";

const ITEMS = [
  {
    n: "01",
    title: "Native iOS & Android",
    text: "Swift and Kotlin when performance and platform feel really matter — fast, fluid, unmistakably native.",
    tone: "text-racing-bright",
  },
  {
    n: "02",
    title: "Cross-platform builds",
    text: "React Native and Flutter for products that need to move at startup speed without splitting the team in two.",
    tone: "text-brass-dim",
  },
  {
    n: "03",
    title: "MVP sprints",
    text: "From a one-page idea to a testable product in weeks, not quarters — built to prove the thing, not just demo it.",
    tone: "text-burgundy",
  },
  {
    n: "04",
    title: "Product design",
    text: "Interfaces designed like they'll be used daily, because they will be — clarity first, decoration second.",
    tone: "text-brass-dim",
  },
  {
    n: "05",
    title: "Backend & infrastructure",
    text: "APIs, databases and cloud infrastructure that stay calm under real usage, not just in the demo.",
    tone: "text-racing-bright",
  },
  {
    n: "06",
    title: "Post-launch iteration",
    text: "Analytics, releases and roadmap decisions — we stay on as the product grows, not just until launch day.",
    tone: "text-burgundy",
  },
] as const;

export function Craft() {
  return (
    <section
      id="craft"
      className="relative bg-paper-light py-28 text-ink-strong sm:py-36"
    >
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <Reveal>
          <div className="eyebrow flex items-center gap-3 text-xs text-burgundy">
            <span className="h-px w-8 bg-burgundy/50" />
            WHAT WE BUILD
          </div>
          <h2 className="font-display text-balance mt-6 max-w-2xl text-3xl text-ink-strong sm:text-4xl md:text-5xl">
            Full-stack craft, under one roof.
          </h2>
        </Reveal>

        <div className="mt-16 flex flex-col">
          <div className="pinstripe-light" />
          {ITEMS.map((item, i) => (
            <Reveal key={item.n} delay={i * 0.04} y={14}>
              <div className="group grid grid-cols-[3.5rem_1fr] gap-x-6 gap-y-2 py-7 sm:grid-cols-[4.5rem_1fr_1.4fr] sm:items-baseline sm:gap-x-10">
                <span
                  className={`pit-badge text-xl transition-opacity sm:text-2xl ${item.tone}`}
                >
                  {item.n}
                </span>
                <h3 className="font-display text-lg text-ink-strong sm:text-xl">
                  {item.title}
                </h3>
                <p className="col-span-2 text-sm leading-relaxed text-ink-strong/65 sm:col-span-1">
                  {item.text}
                </p>
              </div>
              <div className="pinstripe-light" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
