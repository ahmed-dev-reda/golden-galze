"use client";
import { formatPrice, productName } from "@/lib/format";
import type { Donut } from "@/lib/types";
import { useState } from "react";
import {
  MAX_CART_QUANTITY,
  useCartStore,
} from "@/store/cart-store";

export function ProductCard({ donut }: { donut: Donut }) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItem = useCartStore((state) =>
    state.items.find((item) => item.id === donut.id),
  );
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const quantity = cartItem?.quantity ?? selectedQuantity;

  function decreaseQuantity() {
    if (cartItem) {
      decreaseItem(donut.id);
      return;
    }
    setSelectedQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    if (cartItem) {
      increaseItem(donut.id);
      return;
    }
    setSelectedQuantity((current) =>
      Math.min(MAX_CART_QUANTITY, current + 1),
    );
  }

  return (
    <article className="min-w-0 overflow-hidden rounded-[11px] border border-line bg-white transition hover:-translate-y-[3px] hover:shadow-[0_9px_24px_#563c3212]">
      <div className="relative aspect-[1.15] overflow-hidden bg-[#f9f4f0]">
        {donut.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-full w-full object-cover"
            src={donut.imageUrl}
            alt={productName(donut.name)}
            loading="lazy"
          />
        ) : (
          <div
            className="grid h-full place-items-center text-5xl text-[#dea6a5]"
            aria-hidden="true"
          >
            ✿
          </div>
        )}
      </div>
      <div className="p-2.5 sm:p-3.5">
        <div className="flex flex-col items-start justify-between gap-0.5 sm:flex-row sm:gap-2">
          <h3 className="m-0 text-sm font-semibold sm:text-base">
            {productName(donut.name)}
          </h3>
          <span className="shrink-0 text-[13px] font-bold text-brand sm:text-sm">
            {formatPrice(donut.price)}
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 ">
          <div
            className="flex h-[35px] items-center gap-1.5 rounded-md border border-line px-1.5 sm:gap-3"
            aria-label="اختار الكمية"
          >
            <button
              className="h-7 w-5 border-0 bg-transparent text-xl text-warm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              aria-label="قلل الكمية"
            >
              −
            </button>
            <span className="min-w-3.5 text-center text-[13px]">
              {quantity}
            </span>
            <button
              className="h-7 w-5 border-0 bg-transparent text-xl text-warm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              onClick={increaseQuantity}
              disabled={quantity >= MAX_CART_QUANTITY}
              aria-label="زود الكمية"
            >
              +
            </button>
          </div>
          {cartItem ? (
            <span
              className="inline-flex min-h-[35px] items-center justify-center rounded-md bg-brand-light px-2 text-xs font-semibold text-brand sm:px-3 sm:text-[13px]"
              role="status"
            >
              موجود في السلة
            </span>
          ) : (
            <button
              type="button"
              disabled={!hasHydrated}
              onClick={() => {
                addItem(
                  {
                    id: donut.id,
                    name: donut.name,
                    price: donut.price,
                    image_url: donut.imageUrl,
                  },
                  selectedQuantity,
                );
              }}
              className="inline-flex min-h-[35px] items-center justify-center rounded-md bg-brand px-2 text-xs font-semibold text-white sm:px-3 sm:text-[13px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              ضيف للسلة
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
