import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Neighbors Against Data Centers collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose-nadc">
      <h1 className="font-display text-4xl text-primary mb-2">Privacy Policy</h1>
      <p className="font-mono text-xs text-slate-400 mb-10">Effective June 11, 2026</p>

      <h2>The short version</h2>
      <p>
        We collect the minimum we need, we never sell it, and we treat tipster identities as sensitive. This
        organization exists because of closed-door data practices — we won&apos;t replicate them.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Subscriptions:</strong> your email address, optional phone number and ZIP code, and your alert
          preferences. Email subscriptions use double opt-in; SMS requires separate express consent. We log consent
          events (what you agreed to, and when) because the law requires us to be able to prove it.
        </li>
        <li>
          <strong>Tips:</strong> your message, location details, links you provide, your email, and an optional name.
          Tipster contact information is never published and is restricted to staff who verify reports.
        </li>
        <li>
          <strong>Petitions:</strong> your name, email, ZIP, and optional comment. Public display of your name is
          opt-in only.
        </li>
        <li>
          <strong>Donations and orders:</strong> processed entirely by Stripe — your card details never touch our
          servers. We keep the transaction record (amount, email, items) needed for receipts and fulfillment.
        </li>
        <li>
          <strong>Technical:</strong> standard server logs for security. Form submissions store a one-way hash of your
          IP address for abuse prevention — not the address itself.
        </li>
      </ul>

      <h2>What we never do</h2>
      <ul>
        <li>Sell, rent, or trade your information. To anyone. Ever.</li>
        <li>Publish a tipster&apos;s identity, or share it outside the verification team.</li>
        <li>Put personal data in URLs or query strings.</li>
        <li>Auto-subscribe you to anything — every list is opt-in with confirmation.</li>
      </ul>

      <h2>Service providers</h2>
      <p>
        We use a small set of processors to run the site: a database host, an email provider, an SMS provider
        (Twilio), Stripe for payments, and Cloudflare for security and delivery. Each receives only what it needs to
        perform its function.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Unsubscribe from email via the link in any message, or from SMS by replying STOP.</li>
        <li>
          Request a copy or deletion of your data by emailing{" "}
          <a href="mailto:privacy@nadc.info">privacy@nadc.info</a>. We&apos;ll respond within 30 days.
        </li>
      </ul>

      <h2>Changes</h2>
      <p>
        We&apos;ll post any material changes here with a new effective date, and notify subscribers by email for
        significant ones.
      </p>
    </div>
  );
}
