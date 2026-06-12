import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function AdminOrdersPage() {
  const recent = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
  const items = recent.length
    ? await db.select().from(orderItems)
    : [];
  const itemsByOrder = new Map<number, typeof items>();
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-primary mb-2">Orders</h1>
      <p className="font-body text-xs text-slate-400 mb-8">
        Paid orders need fulfillment. With Printful connected (set product sync IDs in Products), forward paid orders
        through the Printful dashboard or API; otherwise fulfill manually.
      </p>
      <ul className="space-y-4">
        {recent.length === 0 && <li className="font-body text-sm text-slate-500">No orders yet.</li>}
        {recent.map((o) => (
          <li key={o.id} className="card p-5">
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <p className="font-body font-semibold text-sm text-ink">
                Order #{o.id} · ${(o.amountCents / 100).toFixed(2)} · {o.email ?? "no email yet"}
              </p>
              <p className="font-mono text-2xs text-slate-400">
                {o.status.toUpperCase()} · {new Date(o.createdAt).toLocaleString()}
              </p>
            </div>
            <ul className="font-body text-xs text-slate-600 space-y-1">
              {(itemsByOrder.get(o.id) ?? []).map((item) => (
                <li key={item.id}>
                  {item.quantity}× {item.productName}
                  {item.variant && ` (${item.variant})`}
                  {item.customization && ` — "${item.customization}"`}
                </li>
              ))}
            </ul>
            {o.shippingAddress != null && (
              <pre className="font-mono text-2xs text-slate-500 mt-2 whitespace-pre-wrap">
                {JSON.stringify(o.shippingAddress, null, 1)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
