"use client";

import Link from "next/link";
import { CartProvider, useCart } from "@/components/cart";

function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/store/cart" className="btn-outline !py-2 !px-4 text-sm">
      Cart{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex justify-end">
        <CartLink />
      </div>
      {children}
    </CartProvider>
  );
}
