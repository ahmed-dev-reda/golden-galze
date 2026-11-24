import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isOrderMode, type OrderMode } from "@/lib/order-mode";

export const MAX_CART_QUANTITY = 50;

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  /** Today's stock captured when the item was added; null for preorders. */
  stockLimit: number | null;
};

export type CartStore = {
  items: CartItem[];
  mode: OrderMode;
  /** Chosen fulfillment date for preorders (YYYY-MM-DD), computed by the server. */
  preorderDate: string | null;
  hasHydrated: boolean;
  addItem: (
    item: Omit<CartItem, "quantity" | "stockLimit">,
    quantity?: number,
    stockLimit?: number | null,
  ) => void;
  removeItem: (id: string) => void;
  increaseItem: (id: string) => void;
  decreaseItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setMode: (mode: OrderMode) => void;
  setPreorderDate: (value: string | null) => void;
  setHasHydrated: (value: boolean) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validQuantity(value: number, limit = MAX_CART_QUANTITY): number | null {
  if (!Number.isFinite(value) || value < 1) return null;
  return Math.min(limit, Math.floor(value));
}

function readStockLimit(value: unknown, mode: OrderMode): number | null {
  if (mode !== "today") return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));

}

function readPersistedItems(value: unknown, mode: OrderMode): CartItem[] {
  if (!Array.isArray(value)) return [];

  const items = new Map<string, CartItem>();
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;

    const { id, name, price, quantity } = candidate;
    const image = candidate.image_url ?? candidate.imageUrl ?? null;
    const stockLimit = readStockLimit(candidate.stockLimit, mode);
    const count =
      typeof quantity === "number"
        ? validQuantity(quantity, stockLimit ?? MAX_CART_QUANTITY)
        : null;

    if (
      typeof id !== "string" ||
      typeof name !== "string" ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      (image !== null && typeof image !== "string") ||
      count === null
    ) {
      continue;
    }

    const existing = items.get(id);
    items.set(id, {
      id,
      name,
      price,
      image_url: image,
      stockLimit,
      quantity: Math.min(
        stockLimit ?? MAX_CART_QUANTITY,
        (existing?.quantity ?? 0) + count,
      ),
    });
  }

  return [...items.values()].filter(
    (item) => item.quantity > 0 && (item.stockLimit === null || item.quantity <= item.stockLimit),
  );
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      mode: "today",
      preorderDate: null,
      hasHydrated: false,

      addItem: (item, quantity = 1, stockLimit = null) => {
        const limit = stockLimit ?? MAX_CART_QUANTITY;
        const count = validQuantity(quantity, limit);
        if (
          count === null ||
          !item.id ||
          !item.name ||
          !Number.isFinite(item.price) ||
          item.price < 0
        ) {
          return;
        }

        set((state) => {
          const existing = state.items.find((cartItem) => cartItem.id === item.id);
          if (existing) {
            const max = existing.stockLimit ?? MAX_CART_QUANTITY;
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === item.id
                  ? {
                      ...item,
                      stockLimit: existing.stockLimit,
                      quantity: Math.min(max, cartItem.quantity + count),
                    }
                  : cartItem,
              ),
            };
          }

          return { items: [...state.items, { ...item, stockLimit, quantity: count }] };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      increaseItem: (id) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const limit = state.mode === "today" ? item.stockLimit ?? 0 : MAX_CART_QUANTITY;
            return { ...item, quantity: Math.min(limit, item.quantity + 1) };
          }),
        })),

      decreaseItem: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.quantity > 1
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          ),
        })),

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const limit = state.mode === "today" ? item.stockLimit ?? 0 : MAX_CART_QUANTITY;
            const count = validQuantity(quantity, limit);
            return count === null ? item : { ...item, quantity: count };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      // Switching modes clears the cart so today's and tomorrow's items can
      // never be mixed in one order. The UI asks for confirmation first.
      setMode: (mode) =>
        set((state) => ({
          mode,
          items: state.mode === mode ? state.items : [],
          preorderDate: state.mode === mode ? state.preorderDate : null,
        })),

      setPreorderDate: (value) => set({ preorderDate: value }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "golden-glaze-cart",
      skipHydration: true,
      partialize: (state) => ({
        items: state.items,
        mode: state.mode,
        preorderDate: state.preorderDate,
      }),
      merge: (persistedState, currentState) => {
        const persisted = isRecord(persistedState) ? persistedState : {};
        const mode = isOrderMode(persisted.mode) ? persisted.mode : "today";
        const preorderDate =
          typeof persisted.preorderDate === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(persisted.preorderDate)
            ? persisted.preorderDate
            : null;
        return {
          ...currentState,
          mode,
          preorderDate: mode === "preorder" ? preorderDate : null,
          items: readPersistedItems(persisted.items, mode),
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error("Unable to restore the saved cart.", error);
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const selectCartItemCount = (state: CartStore) =>
  state.items.reduce((total, item) => total + item.quantity, 0);

export const selectCartSubtotal = (state: CartStore) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0);
