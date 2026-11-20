"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CART_STORAGE_KEY, MAX_CART_QUANTITY } from "@/lib/constants";
import type { CartItem, Donut } from "@/lib/types";

type CartValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  hydrated: boolean;
  addItem: (donut: Donut, quantity: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartValue | null>(null);
const emptyCart: CartItem[] = [];
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = emptyCart;

function parseCart(raw: string | null): CartItem[] {
  try {
    const stored: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((item): CartItem[] => {
      if (
        typeof item !== "object" || item === null ||
        typeof item.id !== "string" || typeof item.name !== "string" ||
        typeof item.price !== "number" || !Number.isFinite(item.price) ||
        (item.imageUrl !== null && typeof item.imageUrl !== "string") ||
        typeof item.quantity !== "number" || !Number.isInteger(item.quantity) ||
        item.quantity < 1 || item.quantity > MAX_CART_QUANTITY
      ) return [];
      return [{
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
      }];
    });
  } catch {
    return [];
  }
}

function getSnapshot(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = parseCart(raw);
    }
  } catch {
    cachedRaw = null;
    cachedItems = emptyCart;
  }
  return cachedItems;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener("golden-glaze-cart-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("golden-glaze-cart-change", callback);
  };
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydratedSnapshot() {
  return false;
}

function saveCart(items: CartItem[]) {
  const raw = JSON.stringify(items);
  window.localStorage.setItem(CART_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedItems = items;
  window.dispatchEvent(new Event("golden-glaze-cart-change"));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => emptyCart);
  const hydrated = useSyncExternalStore(subscribe, getHydratedSnapshot, getServerHydratedSnapshot);

  const addItem = useCallback((donut: Donut, quantity: number) => {
    const current = getSnapshot();
    const existing = current.find((item) => item.id === donut.id);
    const next = existing
      ? current.map((item) => item.id === donut.id
        ? { ...item, quantity: Math.min(MAX_CART_QUANTITY, item.quantity + quantity) }
        : item)
      : [...current, {
        id: donut.id,
        name: donut.name,
        imageUrl: donut.imageUrl,
        price: donut.price,
        quantity: Math.min(MAX_CART_QUANTITY, quantity),
      }];
    saveCart(next);
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const current = getSnapshot();
    const next = quantity < 1
      ? current.filter((item) => item.id !== id)
      : current.map((item) => item.id === id
        ? { ...item, quantity: Math.min(MAX_CART_QUANTITY, quantity) }
        : item);
    saveCart(next);
  }, []);
  const removeItem = useCallback((id: string) => setQuantity(id, 0), [setQuantity]);
  const clearCart = useCallback(() => saveCart([]), []);
  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    hydrated,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  }), [items, hydrated, addItem, setQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart لازم يكون داخل CartProvider.");
  return value;
}
