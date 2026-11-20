"use client";

import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { MAX_CART_QUANTITY } from "@/lib/constants";
import { formatPrice, productName } from "@/lib/format";
import type { Donut } from "@/lib/types";

export function ProductCard({ donut }: { donut: Donut }) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const count = items.find((item) => item.id === donut.id)?.quantity ?? 0;

  function addToCart() {
    addItem(donut, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="min-w-0 overflow-hidden rounded-[11px] border border-[#eee7e1] bg-white transition hover:-translate-y-[3px] hover:shadow-[0_9px_24px_#563c3212]">
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
        {count > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] text-[#cb607a] shadow-sm">
            {count} في السلة
          </span>
        )}
      </div>
      <div className="p-2.5 sm:p-3.5">
        <div className="flex flex-col items-start justify-between gap-0.5 sm:flex-row sm:gap-2">
          <h3 className="m-0 text-sm font-semibold sm:text-base">
            {productName(donut.name)}
          </h3>
          <span className="shrink-0 text-[13px] font-bold text-[#cb607a] sm:text-sm">
            {formatPrice(donut.price)}
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 ">
          <div
            className="flex h-[35px] items-center gap-1.5 rounded-md border border-[#eee7e1] px-1.5 sm:gap-3"
            aria-label="اختار الكمية"
          >
            <button
              className="h-7 w-5 cursor-pointer border-0 bg-transparent text-xl text-[#6a4537]"
              type="button"
              aria-label="قلل الكمية"
              onClick={() => setQuantity((n) => Math.max(1, n - 1))}
            >
              −
            </button>
            <span
              aria-live="polite"
              className="min-w-3.5 text-center text-[13px]"
            >
              {quantity}
            </span>
            <button
              className="h-7 w-5 cursor-pointer border-0 bg-transparent text-xl text-[#6a4537]"
              type="button"
              aria-label="زود الكمية"
              onClick={() =>
                setQuantity((n) => Math.min(MAX_CART_QUANTITY, n + 1))
              }
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="inline-flex min-h-[35px] cursor-pointer items-center justify-center rounded-md bg-[#cb607a] px-2 text-xs font-semibold text-white transition hover:bg-[#b94f69] sm:px-3 sm:text-[13px]"
            onClick={addToCart}
          >
            {added ? "اتضافت ✓" : "ضيف للسلة"}
          </button>
        </div>
      </div>
    </article>
  );
}
