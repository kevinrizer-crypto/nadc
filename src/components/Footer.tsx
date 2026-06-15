import Link from "next/link";
import Image from "next/image";
import { SITE_TAGLINE } from "@/lib/site";

const columns: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Resources",
    links: [
      { label: "National Tracker", href: "/tracker" },
      { label: "Learn", href: "/learn" },
      { label: "Organize", href: "/organize" },
      { label: "Make a Yard Sign", href: "/yard-sign" },
      { label: "Store", href: "/store" },
      { label: "The Grid Newsletter", href: "/subscribe" },
    ],
  },
  {
    heading: "Organization",
    links: [
      { label: "About", href: "/about" },
      { label: "Editorial Principles", href: "/about#principles" },
      { label: "Funding Transparency", href: "/about#funding" },
      { label: "Press", href: "/about#press" },
      { label: "Contact", href: "/about#contact" },
    ],
  },
  {
    heading: "Take Action",
    links: [
      { label: "Report a Project", href: "/report" },
      { label: "Petitions", href: "/act/petitions" },
      { label: "Write Your Officials", href: "/act/officials" },
      { label: "Donate", href: "/donate" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <Image src="/brand/shield.png" alt="NADC shield logo" width={56} height={56} />
            <p className="font-display text-lg mt-4 leading-snug">{SITE_TAGLINE}</p>
            <p className="font-mono text-2xs text-white/50 mt-4 leading-relaxed">
              Every claim on this site carries a source. We correct our errors prominently.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-white/60 mb-4">{col.heading}</h2>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="font-body text-sm text-white/80 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-white/15 mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3">
          <p className="font-body text-xs text-white/50">
            © {new Date().getFullYear()} Neighbors Against Data Centers™ · Non-partisan, pro-transparency.
          </p>
          <p className="font-body text-xs text-white/50 space-x-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/consent-policy" className="hover:text-white">
              Consent Policy
            </Link>
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
