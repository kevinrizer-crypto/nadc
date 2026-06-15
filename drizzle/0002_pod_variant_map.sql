-- Per-variant Printful sync-variant IDs. A product (e.g. a t-shirt) maps each
-- variant label ("S", "M", …) to its Printful sync_variant_id; single-variant
-- products (sticker, pin) use a single "" key. Powers auto-fulfillment.
ALTER TABLE "products" ADD COLUMN "pod_variant_map" jsonb NOT NULL DEFAULT '{}';

-- Printful order id, recorded on fulfillment.
-- (orders.pod_order_id already exists from the initial schema.)
