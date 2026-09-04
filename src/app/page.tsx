import Link from "next/link";
import Image from "next/image";
import { getHomeCounters, getPublishedPosts, getPublishedProjects } from "@/lib/queries";
import { getImpacts } from "@/lib/content";
import SubscribeForm from "@/components/SubscribeForm";
import TrackerSearch from "@/components/TrackerSearch";
import StatusBadge from "@/components/StatusBadge";
import { SITE_TAGLINE } from "@/lib/site";
import { formatDateUTC } from "@/lib/dates";

export const revalidate = 300; // counters and news refresh every 5 minutes

/** Below this, the subscriber counter is hidden rather than shown as weak proof. */
const SUBSCRIBER_COUNT_THRESHOLD = 250;

export default async function HomePage() {
  const [counters, latestPosts, projects] = await Promise.all([
    getHomeCounters().catch(() => null),
    getPublishedPosts(3).catch(() => []),
    getPublishedProjects().catch(() => []),
  ]);

  const impacts = getImpacts();
  const upcoming = projects
    .filter((p) => p.nextHearingDate && new Date(p.nextHearingDate) >= new Date())
    .sort((a, b) => (a.nextHearingDate! < b.nextHearingDate! ? -1 : 1))
    .slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/70 mb-4">
              Before they break ground, get organized
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">{SITE_TAGLINE}</h1>
            <p className="font-body text-lg text-white/85 leading-relaxed mb-10 max-w-2xl">
              NADC tracks every proposed data center in America — the power draw, the water use, the tax deals, and the
              public hearings where your voice still matters.
            </p>

            <div className="card p-2 sm:p-3 max-w-2xl">
              <h2 className="font-body font-semibold text-ink text-sm px-2 pt-2">
                Is a data center proposed near you?
              </h2>
              <TrackerSearch />
            </div>
          </div>

          {/* Live counters */}
          {counters && (
            <dl
              className={`grid grid-cols-2 ${
                counters.subscribers >= SUBSCRIBER_COUNT_THRESHOLD ? "sm:grid-cols-4" : "sm:grid-cols-3"
              } gap-6 mt-16 max-w-3xl`}
            >
              {[
                { label: "Projects Tracked", value: counters.projectsTracked },
                { label: "Active Fights", value: counters.activeFights },
                { label: "Community Wins", value: counters.communityWins },
                // Social proof cuts both ways: a tiny subscriber number in the
                // hero reads as "nobody is here". Show it only once it helps.
                ...(counters.subscribers >= SUBSCRIBER_COUNT_THRESHOLD
                  ? [{ label: "Subscribers", value: counters.subscribers }]
                  : []),
              ].map((c) => (
                <div key={c.label}>
                  <dt className="font-mono text-2xs uppercase tracking-[0.2em] text-white/60 order-2">{c.label}</dt>
                  <dd className="font-display text-4xl">{c.value.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* Impacts */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <p className="section-label">Education Layer</p>
            <h2 className="font-display text-4xl sm:text-5xl text-primary mb-4">Understand the real impacts</h2>
            <p className="text-slate-500 font-body text-base leading-relaxed">
              Every claim on this page carries a source. Your right to know begins with accurate, evidence-based
              information — not industry talking points.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {impacts.map((card) => (
              <Link
                key={card.title}
                href={`/learn/${card.pillar}`}
                className="card p-6 hover:border-primary/40 transition-colors group block"
              >
                <p className="font-body font-semibold text-ink text-sm mb-3 group-hover:text-primary transition-colors">
                  {card.title}
                </p>
                <p className="mb-3">
                  <span className="font-display text-3xl text-primary">{card.stat}</span>
                  <span className="font-mono text-xs text-slate-400 ml-2">{card.statLabel}</span>
                </p>
                <p className="text-slate-500 text-sm font-body leading-relaxed mb-3">{card.detail}</p>
                <p className="text-slate-400 text-2xs font-mono leading-relaxed">Source: {card.source}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming hearings + news */}
      <section className="py-20 bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
          <div>
            <p className="section-label">Where your voice still matters</p>
            <h2 className="font-display text-3xl text-primary mb-6">Upcoming hearings</h2>
            {upcoming.length === 0 ? (
              <p className="font-body text-sm text-slate-500">
                No verified upcoming hearing dates right now. Hearing dates are added as we confirm them —{" "}
                <Link href="/report" className="text-primary underline">
                  report one
                </Link>{" "}
                if you know of a hearing we&apos;re missing.
              </p>
            ) : (
              <ul className="space-y-4">
                {upcoming.map((p) => (
                  <li key={p.id} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/tracker/${p.state.toLowerCase()}/${p.slug}`}
                          className="font-body font-semibold text-ink hover:text-primary"
                        >
                          {p.name}
                        </Link>
                        <p className="font-body text-sm text-slate-500">
                          {p.city}, {p.state} —{" "}
                          {formatDateUTC(p.nextHearingDate!)}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/tracker" className="btn-outline mt-6">
              Open the National Tracker
            </Link>
          </div>

          <div>
            <p className="section-label">News</p>
            <h2 className="font-display text-3xl text-primary mb-6">Latest from NADC</h2>
            {latestPosts.length === 0 ? (
              <p className="font-body text-sm text-slate-500">
                The Grid — our weekly national roundup — launches with the site. Subscribe below to get the first issue.
              </p>
            ) : (
              <ul className="space-y-4">
                {latestPosts.map((post) => (
                  <li key={post.id} className="card p-5">
                    <Link href={`/news/${post.slug}`} className="font-body font-semibold text-ink hover:text-primary">
                      {post.title}
                    </Link>
                    {post.excerpt && <p className="font-body text-sm text-slate-500 mt-1">{post.excerpt}</p>}
                  </li>
                ))}
              </ul>
            )}
            <div className="card p-6 mt-6">
              <h3 className="font-body font-semibold text-ink mb-1">Subscribe to The Grid</h3>
              <p className="font-body text-sm text-slate-500 mb-4">
                Weekly national roundup of project filings, hearings, and fight outcomes.
              </p>
              <SubscribeForm compact />
            </div>
          </div>
        </div>
      </section>

      {/* Report CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Image src="/brand/shield.png" alt="" width={64} height={64} className="mx-auto mb-6" />
          <h2 className="font-display text-4xl text-primary mb-4">Heard a rumor? Seen a rezoning notice?</h2>
          <p className="font-body text-base text-slate-500 max-w-2xl mx-auto mb-8">
            Tips from neighbors are how the tracker grows. Every report is reviewed and verified against public records
            before publication — and your identity stays protected.
          </p>
          <Link href="/report" className="btn-accent">
            Report a Proposed Data Center
          </Link>
        </div>
      </section>
    </>
  );
}
