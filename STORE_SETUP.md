# Store Setup & Fulfillment

NADC's store has two fulfillment paths by design, because the catalog splits
into two physically different product types.

## 1. Merch — Printful (automatic, zero-touch)

T-shirts, hoodies, caps, totes, **stickers**, **enamel pins**. Printful prints
each item on demand and ships it directly to the buyer with NADC branding — no
inventory, no packing.

**One-time setup:**

1. Create a free account at **printful.com** (no monthly fee; you pay item cost
   + shipping per order, keep the markup).
2. **Create each product** in Printful using your brand art (`public/brand/`):
   build the shirt, hoodie, cap, tote, sticker, and pin, pick the blanks/colors,
   and upload the design. Printful gives each a **sync variant ID** per
   size/color.
3. **API key:** Printful → Settings → Developers → **API Token** (store-level).
   In Vercel → Environment Variables, add:
   - `PRINTFUL_API_KEY` = the token
   - `PRINTFUL_STORE_ID` = your store id (only if your account has multiple stores)
   - `PRINTFUL_AUTO_CONFIRM` = leave unset at first (orders arrive as **drafts**
     you confirm in Printful — good for the first few). Set to `true` later for
     full hands-off auto-submit.
4. **Map variants to products** in `/admin/products`: for each product, paste a
   JSON map of variant label → Printful sync variant ID.
   - Multi-variant (shirt/hoodie): `{"S":"4011","M":"4012","L":"4013", ...}`
   - Single-variant (sticker/pin/cap/tote): `{"":"4099"}`
   - The admin row shows "✓ Printful-connected" once a map is saved.
5. **Redeploy.** Done. From then on, a paid Stripe order whose items are *all*
   Printful-mapped is forwarded automatically; the order shows a Printful order
   id in `/admin/orders`.

**Safety behavior (already built in):**
- If `PRINTFUL_API_KEY` is unset, nothing is faked — orders just wait in
  `/admin/orders` for manual handling.
- An order is auto-submitted only if **every** line item maps to a Printful
  variant. Mixed orders (e.g. a shirt + a bulk yard sign) go to manual
  fulfillment so you never ship half an order.
- If Printful rejects an order, you get an admin email and the order stays
  `paid` for manual follow-up.

## 2. Yard signs — downloadable + bulk

Coroplast yard signs aren't a print-on-demand product, and the flagship is the
*customizable* "[TOWN] Against the Data Center" sign. Two paths, both low-touch:

**a. Free downloadable custom sign (already live, zero-touch).**
`/yard-sign` lets anyone enter their town and download a print-ready 18″×24″
file to print at any local sign shop. It's linked from the store, the Organize
page, the footer, and every project page (pre-filled with that project's town).
Nothing to maintain — it's generated on the fly.

**b. Pre-printed signs & Organizer Kits (occasional bulk).**
The physical yard-sign, door-hanger, postcard, and Organizer Kit listings stay
in the store as made-to-order bulk items. These have no Printful map, so paid
orders for them land in `/admin/orders` for you to fulfill through a sign
printer (Signs.com, 48HourPrint, or a local union shop). Lower volume, higher
value — worth the manual touch.

## Pricing & margin notes

- Stickers and pins are the **highest-margin** items (cheap to make) — great for
  list-building giveaways and impulse adds.
- Shirts/hoodies are moderate margin; set retail to cover Printful base + a
  contribution to the research op (the store already says proceeds fund the
  work on every page).
- Every product page and the cart reiterate "store proceeds fund the research
  operation," per the brand's transparency commitment.

## Quick checklist

- [ ] Printful account created
- [ ] Products built in Printful (shirt, hoodie, cap, tote, sticker, pin)
- [ ] `PRINTFUL_API_KEY` (+ optional `PRINTFUL_STORE_ID`) in Vercel
- [ ] Variant maps pasted into `/admin/products`
- [ ] Test order in Stripe test mode → confirm it appears in Printful as a draft
- [ ] Flip `PRINTFUL_AUTO_CONFIRM=true` once you trust the flow
- [ ] (Optional) line up a sign printer for bulk yard-sign / Organizer Kit orders
