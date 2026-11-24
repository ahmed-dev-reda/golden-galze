"use client";

import { AnimatePresence, motion } from "motion/react";
import { formatPrice, productName } from "@/lib/format";
import type { Donut } from "@/lib/types";
import { useState } from "react";
import { MAX_CART_QUANTITY, useCartStore } from "@/store/cart-store";
import { Check, ShoppingCart } from "lucide-react";

export function ProductCard({ donut, index }: { donut: Donut; index: number }) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItem = useCartStore((state) =>
    state.items.find((item) => item.id === donut.id),
  );
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const mode = useCartStore((state) => state.mode);

  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const isToday = mode === "today";
  const todayLimit = donut.stockIsCurrent
    ? Math.min(MAX_CART_QUANTITY, Math.max(0, Math.floor(donut.todayStock ?? 0)))
    : 0;
  const maxQuantity = isToday ? todayLimit : MAX_CART_QUANTITY;
  const soldOut = isToday && maxQuantity < 1;
  const quantity = Math.min(
    cartItem?.quantity ?? selectedQuantity,
    Math.max(1, maxQuantity),
  );

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
    setSelectedQuantity((current) => Math.min(maxQuantity, current + 1));
  }

  function handleAddToCart() {
    if (!hasHydrated || soldOut) return;

    setIsAdded(true);
    addItem(
      {
        id: donut.id,
        name: donut.name,
        price: donut.price,
        image_url: donut.imageUrl,
      },
      quantity,
      isToday ? todayLimit : null,
    );

    setTimeout(() => setIsAdded(false), 700);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: index * 0.15,
      }}
      className="min-w-0 overflow-hidden rounded-[11px] bg-white shadow"
    >
      <div className="relative aspect-[1.15] overflow-hidden bg-[#f9f4f0]">
        {donut.imageUrl ? (
          <motion.img
            src={donut.imageUrl}
            alt={productName(donut.name)}
            loading="lazy"
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ) : (
          <div
            className="grid h-full place-items-center text-5xl text-[#dea6a5]"
            aria-hidden="true"
          >
            ✿
          </div>
        )}
        {soldOut && (
          <span className="absolute right-2 top-2 rounded-md bg-[#9b2939] px-2 py-1 text-[11px] font-bold text-white">
            نفدت الكمية
          </span>
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

        <p
          className={`mb-0 mt-1.5 text-[12px] font-semibold ${
            soldOut ? "text-[#9b2939]" : "text-brand"
          }`}
          aria-live="polite"
        >
          {isToday
            ? donut.stockIsCurrent
              ? `الكمية المتاحة: ${todayLimit}`
              : "الكمية المتاحة غير محددة اليوم"
            : "حجز لبكرة — متاح بأي كمية"}
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
          <div
            className="flex h-[35px] items-center max-[300px]:mx-auto gap-1.5 rounded-md border border-line px-1.5 sm:gap-3"
            aria-label="اختار الكمية"
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.8 }}
              className="h-7 w-5 border-0 bg-transparent text-xl text-warm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              onClick={decreaseQuantity}
              disabled={quantity <= 1 || soldOut}
              aria-label="قلل الكمية"
            >
              −
            </motion.button>

            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={quantity}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="min-w-3.5 text-center text-[13px]"
              >
                {quantity}
              </motion.span>
            </AnimatePresence>

            <motion.button
              type="button"
              whileTap={{ scale: 0.8 }}
              className="h-7 w-5 border-0 bg-transparent text-xl text-warm cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              onClick={increaseQuantity}
              disabled={quantity >= maxQuantity || soldOut}
              aria-label="زود الكمية"
            >
              +
            </motion.button>
          </div>

          <div className="grid place-items-center">
            <AnimatePresence mode="wait" initial={false}>
              {isAdded ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="rounded p-1 text-brand"
                  role="status"
                >
                  <Check size={19} />
                </motion.span>
              ) : (
                <motion.button
                  key="cart"
                  type="button"
                  disabled={!hasHydrated || soldOut}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={handleAddToCart}
                  className="cursor-pointer rounded p-1 transition-colors hover:bg-brand/20 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={soldOut ? "نفدت الكمية" : "أضف إلى السلة"}
                >
                  <ShoppingCart size={19} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
