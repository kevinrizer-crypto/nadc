"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "./cart";

export type ClientProduct = {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  imageUrl: string | null;
  customizable: boolean;
  badge: string | null;
  variants: string[];
};

const CATEGORIES: Record<string, string> = {
  all: "All Products",
  signs: "Yard Signs",
  apparel: "Apparel",
  accessories: "Stickers & Pins",
  print: "Print Materials",
  bundle: "Organizer Bundles",
};

function ProductCard({ product }: { product: ClientProduct }) {
  const { add } = useCart();
  const [variant, setVariant] = useState(product.variants[0] ?? "");
  const [customization, setCustomization] = useState("");
  const [added, setAdded] = useState(false);

  function addToCart() {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      quantity: 1,
      variant: variant || undefined,
      customization: customization || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="card overflow-hidden flex flex-col group hover:border-primary/40 transition-colors">
      <div className="relative aspect-[4/3] bg-paper overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image src="/brand/shield.png" alt="" width={80} height={80} className="opacity-30" />
          </div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-accent text-white font-mono text-2xs uppercase tracking-wider px-2 py-1 rounded-sm">
            {product.badge}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-body font-semibold text-ink text-sm mb-1">{product.name}</h3>
        <p className="font-body text-xs text-slate-500 leading-relaxed mb-3 flex-1">{product.description}</p>

        {product.customizable && (
          <label className="block mb-2">
            <span className="font-body text-xs font-semibold text-ink">Your town name</span>
            <input
              type="text"
              maxLength={40}
              className="input !py-2 text-sm"
              placeholder="e.g. GRIFFIN"
              value={customization}
              onChange={(e) => setCustomization(e.target.value.toUpperCase())}
            />
          </label>
        )}
        {product.variants.length > 0 && (
          <label className="block mb-2">
            <span className="sr-only">Variant</span>
            <select className="input !py-2 text-sm" value={variant} onChange={(e) => setVariant(e.target.value)}>
              {product.variants.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="font-display text-xl text-primary">${(product.priceCents / 100).toFixed(0)}</span>
          <button type="button" className="btn-primary !py-2 !px-4 text-sm" onClick={addToCart}>
            {added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({ products }: { products: ClientProduct[] }) {
  const [category, setCategory] = useState("all");
  const visible = category === "all" ? products : products.filter((p) => p.category === category);

  return (
    <div>
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2 mb-8">
        {Object.entries(CATEGORIES).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
            className={`px-4 py-2 font-body text-sm font-medium rounded-sm border ${
              category === value
                ? "bg-primary text-white border-primary"
                : "bg-white text-slate-600 border-[#CCCCCC] hover:border-primary/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="font-body text-sm text-slate-500">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
