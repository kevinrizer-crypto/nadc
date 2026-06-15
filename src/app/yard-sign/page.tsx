import type { Metadata } from "next";
import { Suspense } from "react";
import YardSignMaker from "./YardSignMaker";

export const metadata: Metadata = {
  title: "Make a Free [Your Town] Yard Sign",
  description:
    "Create a free, print-ready 'Against the Data Center' yard sign for your town. Enter your community, download the PDF, and print it locally. Yard signs turn private worry into visible consensus.",
  alternates: { canonical: "/yard-sign" },
};

export default async function YardSignPage({ searchParams }: { searchParams: Promise<{ town?: string }> }) {
  const { town } = await searchParams;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="section-label">Free Organizing Tool</p>
      <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Make your town&apos;s yard sign</h1>
      <p className="font-body text-base text-slate-500 leading-relaxed mb-10 max-w-2xl">
        Officials count yard signs on their commute — they turn private worry into visible consensus. Enter your town,
        download a print-ready file, and print it at any local sign shop. Free, because every sign is a billboard for
        the cause.
      </p>
      <Suspense>
        <YardSignMaker defaultTown={town ?? ""} />
      </Suspense>
    </div>
  );
}
