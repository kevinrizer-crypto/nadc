import type { Metadata } from "next";
import SubscribeForm from "@/components/SubscribeForm";

export const metadata: Metadata = {
  title: "Subscribe to The Grid — Alerts & Newsletter",
  description:
    "The Grid is NADC's weekly national roundup of data center filings, hearings, and fight outcomes. Get email or SMS alerts for projects near you.",
  alternates: { canonical: "/subscribe" },
};

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string; unsub?: string }>;
}) {
  const { confirm, unsub } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {confirm === "ok" && (
        <div className="card border-emerald-300 bg-emerald-50 p-5 mb-8" role="status">
          <p className="font-body font-semibold text-emerald-800">Subscription confirmed — welcome aboard.</p>
          <p className="font-body text-sm text-emerald-800/80">
            You&apos;ll get The Grid weekly, plus any local alerts you opted into.
          </p>
        </div>
      )}
      {confirm === "invalid" && (
        <div className="card border-amber-300 bg-amber-50 p-5 mb-8" role="alert">
          <p className="font-body text-sm text-amber-900">
            That confirmation link is invalid or expired. Enter your email below to get a fresh one.
          </p>
        </div>
      )}
      {unsub === "ok" && (
        <div className="card border-slate-300 bg-slate-50 p-5 mb-8" role="status">
          <p className="font-body text-sm text-slate-700">
            You&apos;ve been unsubscribed from all NADC email and SMS. Sorry to see you go.
          </p>
        </div>
      )}

      <p className="section-label">The Grid</p>
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Know what&apos;s coming. Have a say.</h1>
      <p className="font-body text-base text-slate-500 leading-relaxed mb-10">
        One email a week: every new filing, hearing, and fight outcome in the country, sourced and fact-checked. Add
        your ZIP for local alerts, or opt into SMS for urgent hearing notices.
      </p>
      <SubscribeForm />
    </div>
  );
}
