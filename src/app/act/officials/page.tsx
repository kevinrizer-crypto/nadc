import type { Metadata } from "next";
import OfficialsTool from "@/components/OfficialsTool";

export const metadata: Metadata = {
  title: "Write Your Officials",
  description:
    "Find your federal and state representatives by address and send a letter built on NADC's playbook — anchored on zoning criteria, transparency, and ratepayer protection.",
  alternates: { canonical: "/act/officials" },
};

export default function OfficialsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="section-label">Act</p>
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Write Your Officials</h1>
      <p className="font-body text-base text-slate-500 leading-relaxed mb-3">
        Enter your address to find your federal and state representatives, then start from one of our letter templates
        — each built on the playbook&apos;s core rule: <em>fight on the criteria, not the vibes.</em>
      </p>
      <p className="font-body text-sm text-slate-500 mb-10">
        For county and city officials — usually the actual decision-makers on a rezoning — find your project in the{" "}
        <a href="/tracker" className="text-primary underline">
          tracker
        </a>{" "}
        and use its municipality and decision-maker links. Your address is used only for this lookup and is never
        stored.
      </p>
      <OfficialsTool />
    </div>
  );
}
