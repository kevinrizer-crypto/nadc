import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tips", label: "Tips" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/petitions", label: "Petitions" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/donations", label: "Donations" },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await getAdmin();
  if (!email) redirect("/admin/login");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 border-b border-[#CCCCCC] pb-4">
        <nav aria-label="Admin" className="flex flex-wrap gap-4">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="font-body text-sm font-medium text-slate-600 hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/logout" method="post" className="flex items-center gap-3">
          <span className="font-mono text-2xs text-slate-400">{email}</span>
          <button type="submit" className="font-body text-sm text-accent underline">
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
