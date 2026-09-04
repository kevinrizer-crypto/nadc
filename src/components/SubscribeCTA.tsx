import SubscribeForm from "./SubscribeForm";

type Counters = { projectsTracked: number; activeFights: number; communityWins: number };

/**
 * The newsletter ask, with a reason and proof attached.
 *
 * Two things this fixes over a bare <SubscribeForm/>:
 *  - It leads with why the list is worth joining ("know before the hearing")
 *    rather than describing what the list is.
 *  - It puts the counters next to the ask. They previously lived only in the
 *    hero, several screens away from the point where someone decides — and
 *    "communities have already won" is the number that turns despair into
 *    "this is winnable", which is what actually earns the signup.
 *
 * `banner` sits high on the homepage, above the education section; `card` is
 * the in-column version. One component so the copy can't drift between them.
 */
export default function SubscribeCTA({
  counters,
  variant = "banner",
  className = "",
}: {
  counters: Counters | null;
  variant?: "banner" | "card";
  className?: string;
}) {
  const banner = variant === "banner";

  const proof = counters ? (
    <p className="font-mono text-2xs uppercase tracking-[0.15em] text-slate-500 mt-4">
      {counters.projectsTracked.toLocaleString()} projects tracked
      <span aria-hidden="true"> · </span>
      {counters.activeFights.toLocaleString()} active fights
      <span aria-hidden="true"> · </span>
      {counters.communityWins.toLocaleString()} communities have already won
    </p>
  ) : null;

  return (
    <div className={`card ${banner ? "p-6 sm:p-8" : "p-6"} ${className}`}>
      <p className="section-label">The Grid</p>
      <h2 className={`font-display text-primary mb-3 ${banner ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
        Know before the hearing, not after.
      </h2>
      <p className={`font-body text-slate-500 leading-relaxed mb-5 ${banner ? "text-base max-w-2xl" : "text-sm"}`}>
        Most data centers get approved at meetings neighbors never heard about. One email a week: every new filing,
        hearing, and outcome in the country — plus anything near your ZIP.
      </p>
      <SubscribeForm compact />
      {proof}
    </div>
  );
}
