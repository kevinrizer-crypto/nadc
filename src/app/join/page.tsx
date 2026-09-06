import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getHomeCounters } from "@/lib/queries";
import SubscribeForm from "@/components/SubscribeForm";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Know before the hearing — Neighbors Against Data Centers",
  description:
    "Most data centers are approved before neighbors hear about them. One free email a week: every new filing and hearing in the country, plus alerts near your ZIP.",
  // Ad destination, not a content page. Kept out of the index so it cannot
  // compete with the homepage for the same terms.
  robots: { index: false, follow: true },
};

/**
 * Dedicated landing page for paid traffic.
 *
 * The homepage serves five audiences and carries 42 links, which makes it a
 * good hub and a poor campaign page. This page has one ask, no navigation, and
 * nothing below the fold that competes with it. Point ads here rather than at
 * `/` so the destination can be measured cleanly against the same creative.
 *
 * Chrome is suppressed via SiteChrome's BARE_ROUTES.
 */
export default async function JoinPage() {
  const counters = await getHomeCounters().catch(() => null);

  const benefits = [
    "Every new filing and hearing in the country, once a week.",
    "An alert when something is proposed near your ZIP.",
    "Plain-language research you can cite at a public meeting.",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark text-white">
      {/* Identity without an exit: the mark and name are shown, not linked. */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 flex items-center gap-2">
        <Image src="/brand/shield.png" alt="" width={36} height={36} priority />
        <span className="font-body font-bold text-white text-[11px] leading-[1.15] tracking-tight uppercase">
          Neighbors Against
          <br />
          Data Centers
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <h1 className="font-display text-3xl sm:text-5xl leading-tight mb-4">
          Most data centers are approved before neighbors hear about them.
        </h1>
        <p className="font-body text-base sm:text-lg text-white/85 leading-relaxed mb-6">
          We track every proposed data center in America — the power draw, the water use, the tax deals, and the
          hearing dates. Free, sourced, and written for people who have to speak at the meeting.
        </p>

        <div className="card p-4 sm:p-6">
          {counters && (
            <p className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-500 mb-3">
              {counters.projectsTracked.toLocaleString()} projects tracked
              <span aria-hidden="true"> · </span>
              {counters.communityWins.toLocaleString()} communities have already won
            </p>
          )}
          <SubscribeForm compact />
        </div>

        <ul className="mt-10 space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3 font-body text-base text-white/90">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="mt-0.5 shrink-0 text-white/70"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 border-t border-white/20 pt-6">
          <p className="font-body text-sm text-white/70 leading-relaxed">
            Every claim we publish carries a source. No ads and no industry money — the research is paid for by
            neighbors. We use double opt-in, so nothing is sent until you confirm, and you can unsubscribe in one
            click.
          </p>
          <p className="font-body text-xs text-white/50 mt-4">
            <Link href="/" className="underline hover:text-white/80">
              About Neighbors Against Data Centers
            </Link>
            <span aria-hidden="true"> · </span>
            <Link href="/privacy" className="underline hover:text-white/80">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
