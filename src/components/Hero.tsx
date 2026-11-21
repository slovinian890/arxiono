"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { CircularBadge } from "./CircularBadge";
import { GaugeRing } from "./GaugeRing";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-20"
    >
      {/* instrument-dial backdrop, in place of generic ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <GaugeRing className="absolute -right-[12%] top-1/2 h-[720px] w-[720px] -translate-y-1/2 text-surface-line sm:h-[820px] sm:w-[820px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,10,6,0.35)_0%,transparent_22%,transparent_78%,rgba(0,10,6,0.5)_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute -top-6 right-6 hidden h-44 w-44 text-brass/70 sm:block lg:-top-10 lg:right-10 lg:h-52 lg:w-52"
        >
          <CircularBadge className="h-full w-full" />
          <Image
            src="/arxiono-mark.png"
            alt=""
            width={120}
            height={120}
            aria-hidden
            className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full lg:h-16 lg:w-16"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="eyebrow flex items-center gap-3 text-xs text-brass"
        >
          <span className="h-px w-8 bg-brass/60" />
          ARXIONO — MOBILE APP STUDIO
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-balance mt-8 max-w-4xl text-[2.6rem] leading-[1.08] text-paper sm:text-6xl md:text-7xl"
        >
          Every great app begins as a thought someone can&rsquo;t put down.
          <span className="italic text-racing-glow"> We finish it.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 max-w-xl text-balance text-base text-paper-dim sm:text-lg"
        >
          Arxiono designs and builds mobile apps for founders who&rsquo;d
          rather have a partner than a vendor. Bring the idea — we bring the
          craft, the code, and sometimes, a seat at the table.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-11 flex flex-wrap items-center gap-5"
        >
          <a
            href="#pitch"
            className="group inline-flex items-center gap-2 rounded-full bg-racing-bright px-7 py-3.5 text-sm font-medium text-paper shadow-[0_0_0_1px_rgba(196,162,103,0.25)] transition-all hover:bg-racing-glow hover:text-ink"
          >
            Pitch your idea
          </a>
          <a
            href="#story"
            className="inline-flex items-center gap-2 text-sm text-paper-dim transition-colors hover:text-brass-bright"
          >
            Read how we work
            <ArrowDown size={15} className="opacity-70" />
          </a>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] text-muted sm:flex">
        <span className="eyebrow">SCROLL</span>
        <span className="h-10 w-px bg-gradient-to-b from-muted to-transparent" />
      </div>
    </section>
  );
}
