import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative border-t border-surface-line/60 bg-ink">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/arxiono-mark.png"
              alt="Arxiono"
              width={30}
              height={30}
              className="h-7 w-7"
            />
            <div>
              <div className="font-display text-base text-paper">Arxiono</div>
              <div className="text-xs text-muted">Mobile app studio</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-paper-dim sm:items-end">
            <a
              href="mailto:hello@arxiono.com"
              className="transition-colors hover:text-brass"
            >
              hello@arxiono.com
            </a>
            <span className="text-xs text-muted">Remote-first · Worldwide</span>
          </div>
        </div>

        <div className="pinstripe mt-10" />

        <div className="mt-6 flex flex-col-reverse items-start justify-between gap-4 text-xs text-muted sm:flex-row sm:items-center">
          <span>© 2026 Arxiono. All rights reserved.</span>
          <nav className="font-condensed flex gap-6 uppercase tracking-wider">
            <a href="#story" className="hover:text-paper-dim">Story</a>
            <a href="#craft" className="hover:text-paper-dim">Craft</a>
            <a href="#partnership" className="hover:text-paper-dim">Partnership</a>
            <a href="#pitch" className="hover:text-paper-dim">Pitch</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
