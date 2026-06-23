"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/site";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#CCCCCC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" aria-label="Neighbors Against Data Centers — home">
            <Image src="/brand/shield.png" alt="" width={40} height={40} priority />
            <span className="font-body font-bold text-ink leading-tight text-sm hidden sm:block">
              NEIGHBORS AGAINST
              <br />
              DATA CENTERS
            </span>
            <span className="font-body font-bold text-ink text-sm sm:hidden">NADC</span>
          </Link>

          <nav aria-label="Main" className="hidden lg:flex items-center gap-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-body text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith(item.href) ? "text-primary" : "text-slate-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/report" className="btn-outline !px-4 !py-2 text-sm">
              Report a Project
            </Link>
            <Link href="/donate" className="btn-accent !px-4 !py-2 text-sm">
              Donate
            </Link>
          </nav>

          <button
            type="button"
            className="lg:hidden p-2 text-ink"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setOpen(!open)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="lg:hidden border-t border-[#CCCCCC] bg-white">
          <div className="px-4 py-4 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 font-body text-base font-medium text-slate-700 hover:bg-primary/5 hover:text-primary rounded-sm"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/report"
              className="block px-3 py-2 font-body text-base font-semibold text-primary"
              onClick={() => setOpen(false)}
            >
              Report a Project
            </Link>
            <Link
              href="/donate"
              className="block px-3 py-2 mt-1 font-body text-base font-semibold text-white bg-accent rounded-sm text-center"
              onClick={() => setOpen(false)}
            >
              Donate
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
