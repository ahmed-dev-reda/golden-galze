import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_CART_QUANTITY = 50;

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

export type CartStore = {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  increaseItem: (id: string) => void;
  decreaseItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setHasHydrated: (value: boolean) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validQuantity(value: number): number | null {
  if (!Number.isFinite(value) || value < 1) return null;
  return Math.min(MAX_CART_QUANTITY, Math.floor(value));
}

function readPersistedItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const items = new Map<string, CartItem>();
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;

    const { id, name, price, quantity } = candidate;
    const image = candidate.image_url ?? candidate.imageUrl ?? null;
    const count =
      typeof quantity === "number" ? validQuantity(quantity) : null;

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
      quantity: Math.min(MAX_CART_QUANTITY, (existing?.quantity ?? 0) + count),
    });
  }

  return [...items.values()];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,

      addItem: (item, quantity = 1) => {
        const count = validQuantity(quantity);
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
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === item.id
                  ? {
                      ...item,
                      quantity: Math.min(
                        MAX_CART_QUANTITY,
                        cartItem.quantity + count,
                      ),
                    }
                  : cartItem,
              ),
            };
          }

          return { items: [...state.items, { ...item, quantity: count }] };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      increaseItem: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: Math.min(MAX_CART_QUANTITY, item.quantity + 1),
                }
              : item,
          ),
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
        const count = validQuantity(quantity);
        if (count === null) return;

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: count } : item,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "golden-glaze-cart",
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const persistedItems = isRecord(persistedState)
          ? persistedState.items
          : undefined;
        return {
          ...currentState,
          items: readPersistedItems(persistedItems),
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
