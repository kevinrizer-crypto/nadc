import { db } from "@/db";
import { products } from "@/db/schema";
import { saveProduct } from "../actions";

export default async function AdminProductsPage() {
  const all = await db.select().from(products).orderBy(products.sortOrder);
  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-2">Products</h1>
      <p className="font-body text-sm text-slate-500 mb-8">
        Price, availability, and Printful sync IDs. Catalog content (names, descriptions) is managed via the seed
        script to keep copy in version control.
      </p>
      <ul className="space-y-4">
        {all.map((p) => (
          <li key={p.id} className="card p-5">
            <p className="font-body font-semibold text-sm text-ink mb-3">
              {p.name} <span className="font-mono text-2xs text-slate-400">({p.category})</span>
            </p>
            <form action={saveProduct} className="flex flex-wrap items-end gap-4">
              <input type="hidden" name="id" value={p.id} />
              <label>
                <span className="label">Price (USD)</span>
                <input type="number" name="price" step="0.01" min="0" defaultValue={(p.priceCents / 100).toFixed(2)} className="input !w-28" />
              </label>
              <label className="flex-1 min-w-48">
                <span className="label">Printful sync variant ID</span>
                <input type="text" name="podProductId" defaultValue={p.podProductId ?? ""} className="input" placeholder="not connected" />
              </label>
              <label className="flex items-center gap-2 font-body text-sm pb-3">
                <input type="checkbox" name="active" defaultChecked={p.active} />
                Active
              </label>
              <button className="btn-primary !py-2 !px-4 text-sm">Save</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
