const MINOR_TICKS = 60;
const MAJOR_EVERY = 5;
const CENTER = 200;
const RADIUS = 186;

// rounded to 2dp so server/client trig float noise can't cause a hydration mismatch
const round = (n: number) => Math.round(n * 100) / 100;

function tick(i: number) {
  const isMajor = i % MAJOR_EVERY === 0;
  const angle = (i / MINOR_TICKS) * Math.PI * 2 - Math.PI / 2;
  const outer = RADIUS;
  const inner = RADIUS - (isMajor ? 16 : 7);
  return {
    x1: round(CENTER + Math.cos(angle) * outer),
    y1: round(CENTER + Math.sin(angle) * outer),
    x2: round(CENTER + Math.cos(angle) * inner),
    y2: round(CENTER + Math.sin(angle) * inner),
    isMajor,
  };
}

export function GaugeRing({ className }: { className?: string }) {
  const ticks = Array.from({ length: MINOR_TICKS }, (_, i) => tick(i));

  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS + 8}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS - 48}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="currentColor"
          strokeWidth={t.isMajor ? 1.4 : 0.8}
          opacity={t.isMajor ? 0.7 : 0.35}
        />
      ))}
    </svg>
  );
}
