"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  quantity: number;
  variant?: string;
  customization?: string;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (index: number) => void;
  setQuantity: (index: number, quantity: number) => void;
  clear: () => void;
  totalCents: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nadc_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupted cart */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value: CartContextValue = {
    items,
    add: (item) =>
      setItems((prev) => {
        const i = prev.findIndex(
          (x) => x.productId === item.productId && x.variant === item.variant && x.customization === item.customization
        );
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], quantity: next[i].quantity + item.quantity };
          return next;
        }
        return [...prev, item];
      }),
    remove: (index) => setItems((prev) => prev.filter((_, i) => i !== index)),
    setQuantity: (index, quantity) =>
      setItems((prev) => prev.map((x, i) => (i === index ? { ...x, quantity: Math.max(1, quantity) } : x))),
    clear: () => setItems([]),
    totalCents: items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    count: items.reduce((sum, i) => sum + i.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
