const REPEAT = 3;
const LABEL = "ARXIONO · MOBILE APP STUDIO · FOUNDED ON AN IDEA · ";

export function CircularBadge({ className }: { className?: string }) {
  const text = LABEL.repeat(REPEAT);

  return (
    <svg
      viewBox="0 0 200 200"
      className={`animate-spin-slow ${className ?? ""}`}
      aria-hidden
    >
      <defs>
        <path
          id="badge-circle"
          d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"
        />
      </defs>
      <circle
        cx="100"
        cy="100"
        r="96"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <circle
        cx="100"
        cy="100"
        r="60"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <text fill="currentColor" fontSize="9.2" letterSpacing="2">
        <textPath href="#badge-circle" startOffset="0%">
          {text}
        </textPath>
      </text>
    </svg>
  );
}
