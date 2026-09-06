"use client";

import { usePathname } from "next/navigation";

/**
 * Routes that render without the site header and footer.
 *
 * On a dedicated ad landing page every navigation link is an exit from a page
 * whose only job is a single conversion. The homepage carries 42 links because
 * it serves five audiences; /join serves one.
 */
const BARE_ROUTES = ["/join"];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (bare) return null;
  return <>{children}</>;
}
