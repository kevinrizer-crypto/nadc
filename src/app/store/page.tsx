import { getActiveProducts } from "@/lib/queries";
import ProductGrid from "@/components/ProductGrid";

// Metadata lives in a route segment config since this layout is client-side;
// title is set via the template in the root layout.
export const revalidate = 300;

export default async function StorePage() {
  let products: Awaited<ReturnType<typeof getActiveProducts>> = [];
  let dbError = false;
  try {
    products = await getActiveProducts();
  } catch {
    dbError = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl mb-12">
        <p className="section-label">NADC Store</p>
        <h1 className="font-display text-4xl sm:text-5xl text-primary mb-4">Gear for the fight</h1>
        <p className="font-body text-base text-slate-500 leading-relaxed">
          Yard signs, door hangers, and organizing kits — designed to be legible at 50 feet.{" "}
          <strong className="text-ink">Store proceeds fund the research operation.</strong>
        </p>
      </div>

      {dbError ? (
        <div className="card p-8 text-center" role="alert">
          <p className="font-body text-sm text-slate-500">The store is temporarily unavailable. Please check back soon.</p>
        </div>
      ) : (
        <ProductGrid
          products={products.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            description: p.description,
            priceCents: p.priceCents,
            category: p.category,
            imageUrl: p.imageUrl,
            customizable: p.customizable,
            badge: p.badge,
            variants: p.variants,
          }))}
        />
      )}
    </div>
  );
}
