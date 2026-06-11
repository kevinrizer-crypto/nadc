import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SMS & Email Consent Policy",
  description: "NADC's messaging consent terms: what you'll receive, how often, and how to stop.",
  alternates: { canonical: "/consent-policy" },
};

export default function ConsentPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose-nadc">
      <h1 className="font-display text-4xl text-primary mb-2">SMS &amp; Email Consent Policy</h1>
      <p className="font-mono text-xs text-slate-400 mb-10">Effective June 11, 2026</p>

      <h2>Email program</h2>
      <ul>
        <li>
          <strong>What you get:</strong> The Grid (weekly national roundup) and, if you opt in, alerts for specific
          states, ZIP codes, or tracked projects.
        </li>
        <li>
          <strong>Double opt-in:</strong> no email is added to any list until you click the confirmation link we send.
        </li>
        <li>
          <strong>Stopping:</strong> every email includes a one-click unsubscribe link. Unsubscribing removes you from
          all NADC email.
        </li>
      </ul>

      <h2>SMS program</h2>
      <ul>
        <li>
          <strong>Program name:</strong> NADC Data Center Alerts.
        </li>
        <li>
          <strong>What you get:</strong> action alerts for upcoming public hearings, votes, and comment deadlines;
          event notifications for town halls and organizing meetings; campaign updates on data center opposition
          efforts; and advocacy news related to data center impacts.
        </li>
        <li>
          <strong>Frequency:</strong> message frequency varies. During active campaign periods — such as the week
          before a public hearing or a legislative vote — frequency may be higher.
        </li>
        <li>
          <strong>Cost:</strong> message and data rates may apply, per your carrier plan.
        </li>
        <li>
          <strong>Opting out:</strong> reply <strong>STOP</strong> to any message to cancel. You&apos;ll receive one
          final confirmation message. Reply <strong>HELP</strong> for help, or contact{" "}
          <a href="mailto:hello@nadc.info">hello@nadc.info</a>.
        </li>
        <li>
          <strong>Consent:</strong> you only receive messages after expressly agreeing at signup. Consent is not a
          condition of any purchase or donation. Carriers are not liable for delayed or undelivered messages.
        </li>
        <li>
          <strong>Privacy:</strong> phone numbers are never sold or shared with third parties for marketing. See the{" "}
          <a href="/privacy">privacy policy</a>.
        </li>
      </ul>
    </div>
  );
}
