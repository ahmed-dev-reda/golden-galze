"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatPrice, productName } from "@/lib/format";
import { ORDER_MODE_LABELS } from "@/lib/order-mode";
import { OrderModeSelector } from "@/components/welcome/buttons";
import {
  MAX_CART_QUANTITY,
  selectCartItemCount,
  selectCartSubtotal,
  useCartStore,
} from "@/store/cart-store";

export function CartPage({
  todayDate,
  tomorrowDate,
}: {
  todayDate: string;
  tomorrowDate: string;
}) {
  const items = useCartStore((state) => state.items);
  const mode = useCartStore((state) => state.mode);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const itemCount = useCartStore(selectCartItemCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const clearCart = useCartStore((state) => state.clearCart);

  // A cart saved on a previous day can hold more than today's stock.
  useEffect(() => {
    if (!hasHydrated || mode !== "today") return;
    for (const item of items) {
      if (item.stockLimit !== null && item.quantity > item.stockLimit) {
        if (item.stockLimit < 1) removeItem(item.id);
        else updateQuantity(item.id, item.stockLimit);
      }
    }
  }, [hasHydrated, items, mode, removeItem, updateQuantity]);

  if (!hasHydrated) {
    return (
      <main
        className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10"
        aria-busy="true"
        aria-live="polite"
      >
        جاري تحميل السلة...
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
        <div className="mx-auto max-w-xl rounded-xl border border-line bg-white px-5 py-10 text-center">
          <div
            className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-brand-light text-3xl text-brand"
            aria-hidden="true"
          >
            ♡
          </div>
          <h1 className="my-2 text-2xl font-bold">السلة لسه فاضية</h1>
          <p className="mb-5 text-muted">
            اختار الدونات اللي بتحبها وضيفها للسلة.
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-hover"
            href="/"
          >
            تسوق الدونات
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-7 sm:py-10">
      <OrderModeSelector
        compact
        className="mb-4"
        todayDate={todayDate}
        tomorrowDate={tomorrowDate}
      />
      <div className="mb-4 rounded-lg bg-brand-light px-4 py-3 text-[13px] font-semibold text-brand">
        {ORDER_MODE_LABELS[mode]} — تاريخ الاستلام:{" "}
        {mode === "today" ? todayDate : tomorrowDate}
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 text-[27px] font-bold">سلة المشتريات</h1>
          <p className="m-0 text-sm text-muted" aria-live="polite">
            {itemCount} قطعة في السلة
          </p>
        </div>
        <button
          className="cursor-pointer rounded-md border-0 bg-transparent px-2 py-2 text-sm text-[#9b4255] hover:bg-brand-light"
          type="button"
          onClick={clearCart}
        >
          إفراغ السلة
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_.8fr]">
        <div className="grid gap-3">
          {items.map((item) => (
            <article
              className="grid grid-cols-[65px_minmax(0,1fr)] items-center gap-2.5 rounded-[10px] border border-line bg-white p-3 sm:grid-cols-[86px_minmax(0,1fr)_auto] sm:gap-4"
              key={item.id}
            >
              <div className="size-[65px] overflow-hidden rounded-md bg-[#f9f4f0] sm:h-[76px] sm:w-[86px]">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="h-full w-full object-cover"
                    src={item.image_url}
                    alt={productName(item.name)}
                  />
                ) : (
                  <div
                    className="grid h-full place-items-center text-3xl text-brand-accent"
                    aria-hidden="true"
                  >
                    ✿
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="mb-1 mt-0 truncate text-[15px] font-semibold">
                  {productName(item.name)}
                </h2>
                <p className="m-0 text-[13px] text-muted">
                  سعر القطعة: {formatPrice(item.price)}
                </p>
                <p className="mb-0 mt-1 text-[13px] font-semibold text-brand">
                  الإجمالي: {formatPrice(item.price * item.quantity)}
                </p>
              </div>
              <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto">
                <div
                  className="flex h-[35px] items-center gap-2 rounded-md border border-line px-1.5"
                  aria-label={`كمية ${productName(item.name)}`}
                >
                  <button
                    className="h-7 w-5 cursor-pointer border-0 bg-transparent text-xl text-warm disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    aria-label="قلل الكمية"
                    disabled={item.quantity <= 1}
                    onClick={() => decreaseItem(item.id)}
                  >
                    −
                  </button>
                  <span className="min-w-4 text-center text-[13px]">
                    {item.quantity}
                  </span>
                  <button
                    className="h-7 w-5 cursor-pointer border-0 bg-transparent text-xl text-warm disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    aria-label="زود الكمية"
                    disabled={
                      item.quantity >=
                      (mode === "today" ? item.stockLimit ?? 0 : MAX_CART_QUANTITY)
                    }
                    onClick={() => increaseItem(item.id)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="cursor-pointer border-0 bg-transparent p-1 text-xs text-[#9b4255] hover:underline"
                  type="button"
                  onClick={() => removeItem(item.id)}
                >
                  حذف
                </button>
              </div>
            </article>
          ))}
          <Link
            className="inline-flex min-h-10 items-center justify-center justify-self-start rounded-lg bg-soft-surface px-4 font-semibold text-warm"
            href="/"
          >
            كمّل تسوق
          </Link>
        </div>

        <aside className="rounded-[10px] border border-line bg-white p-5">
          <h2 className="mb-4 mt-0 text-[17px] font-semibold">ملخص الطلب</h2>
          <div className="my-3 flex justify-between gap-3 text-sm text-muted">
            <span>عدد القطع</span>
            <span>{itemCount}</span>
          </div>
          <div className="my-3 flex justify-between gap-3 text-sm text-muted">
            <span>التوصيل</span>
            <span>بيتحدد حسب العنوان</span>
          </div>
          <div
            className="my-3 flex justify-between gap-3 border-t border-line pt-3 text-base font-bold"
            aria-live="polite"
          >
            <span>المجموع الفرعي</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-hover"
            href="/checkout"
          >
            كمّل الطلب
          </Link>
        </aside>
      </div>
    </main>
  );
}
