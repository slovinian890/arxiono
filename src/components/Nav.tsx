"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#story", label: "Story" },
  { href: "#craft", label: "Craft" },
  { href: "#partnership", label: "Partnership" },
  { href: "#pitch", label: "Pitch an idea" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-ink/80 backdrop-blur-md border-b border-surface-line/60"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <a href="#top" className="flex items-center gap-3 group">
          <Image
            src="/arxiono-mark.png"
            alt="Arxiono"
            width={36}
            height={36}
            className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[20deg] sm:h-9 sm:w-9"
            priority
          />
          <span className="font-display text-lg tracking-wide text-paper">
            Arxiono
          </span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {LINKS.slice(0, 3).map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-condensed text-sm uppercase tracking-wider text-paper-dim transition-colors hover:text-paper"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#pitch"
            className="btn-plate-outline bg-brass/10 text-brass transition-colors hover:bg-brass hover:text-ink"
          >
            Pitch your idea
          </a>
        </div>

        <button
          aria-label="Toggle menu"
          className="text-paper md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-surface-line/60 bg-ink/95 px-6 py-6 md:hidden">
          <div className="flex flex-col gap-5">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-paper-dim hover:text-paper"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
