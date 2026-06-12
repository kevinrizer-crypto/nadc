import type { Metadata } from "next";
import DonateForm from "@/components/DonateForm";

export const metadata: Metadata = {
  title: "Become a Neighbor — Support Fact-Checked Research",
  description:
    "Monthly 'Neighbor' memberships keep NADC's research free for every community facing a data center proposal. One-time gifts welcome too.",
  alternates: { canonical: "/donate" },
};

export default function DonatePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-5 gap-12">
      <div className="lg:col-span-3">
        <p className="section-label">Support the work</p>
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Become a Neighbor</h1>
        <p className="font-body text-base text-slate-500 leading-relaxed mb-8">
          Industry has lobbyists on retainer. We have neighbors who chip in $10–25 a month to keep the research free
          for every community that needs it. Monthly support is what lets us plan — and what lets a town that&apos;s
          never heard of us find a fact-checked answer at 11pm the night they learn about a proposal.
        </p>
        <DonateForm />
      </div>

      <aside className="lg:col-span-2">
        <div className="card p-6 sticky top-24">
          <h2 className="section-label">Where your money goes</h2>
          <p className="font-body text-sm text-slate-600 leading-relaxed mb-4">
            NADC publishes its funding and spending. Our commitment: as the organization matures, at least{" "}
            <strong>65¢ of every dollar</strong> goes directly to mission — research, the tracker, and free organizing
            tools — with the share rising toward 80–85% as we grow. Donor dollars never fund personal attacks or
            partisan campaigns.
          </p>
          <ul className="font-body text-sm text-slate-600 space-y-2 mb-4">
            <li>• Verifying and maintaining the national tracker</li>
            <li>• Fact-checked research anyone can cite — for free</li>
            <li>• Toolkits, templates, and the organizing playbook</li>
            <li>• Keeping the site fast, secure, and independent</li>
          </ul>
          <a href="/about#funding" className="font-body text-sm text-primary underline">
            Read our funding transparency commitment →
          </a>
        </div>
      </aside>
    </div>
  );
}
