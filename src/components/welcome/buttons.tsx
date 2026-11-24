"use client";

import { useState } from "react";
import { Cookie, MoonStar } from "lucide-react";
import { ORDER_MODE_LABELS, type OrderMode } from "@/lib/order-mode";
import { useCartStore } from "@/store/cart-store";

type Props = {
  compact?: boolean;
  className?: string;
  todayDate: string;
  tomorrowDate: string;
};

const options: Array<{
  mode: OrderMode;
  icon: typeof Cookie;
  description: string;
}> = [
  {
    mode: "today",
    icon: Cookie,
    description: "دونات متاح النهاردة، الكمية محدودة حسب المخزون.",
  },
  {
    mode: "preorder",
    icon: MoonStar,
    description: "اطلب بأي كمية واستلمها بكرة طازة.",
  },
];

export function OrderModeSelector({
  compact = false,
  className = "",
  todayDate,
  tomorrowDate,
}: Props) {
  const mode = useCartStore((state) => state.mode);
  const setMode = useCartStore((state) => state.setMode);
  const itemCount = useCartStore((state) => state.items.length);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const [pendingMode, setPendingMode] = useState<OrderMode | null>(null);
  const dates = { today: todayDate, tomorrow: tomorrowDate };

  function choose(next: OrderMode) {
    if (next === mode) return;
    if (!hasHydrated || itemCount === 0) {
      setMode(next);
      return;
    }
    setPendingMode(next);
  }

  function confirmSwitch() {
    if (!pendingMode) return;
    setMode(pendingMode);
    setPendingMode(null);
  }

  if (compact) {
    return (
      <div
        className={`rounded-lg border border-line bg-white p-3 ${className}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {options.map(({ mode: option, icon: Icon }) => (
            <button
              key={option}
              type="button"
              disabled={!hasHydrated}
              aria-pressed={mode === option}
              onClick={() => choose(option)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                mode === option
                  ? "bg-brand text-white"
                  : "bg-brand-light text-brand hover:bg-soft-surface"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {ORDER_MODE_LABELS[option]}
            </button>
          ))}
          {dates && (
            <p className="m-0 mr-auto text-[12px] text-muted">
              تاريخ الاستلام: {mode === "today" ? dates.today : dates.tomorrow}
            </p>
          )}
        </div>
        {pendingMode && (
          <SwitchConfirmation
            next={pendingMode}
            onCancel={() => setPendingMode(null)}
            onConfirm={confirmSwitch}
          />
        )}
      </div>
    );
  }

  return (
    <section
      className={`rounded-xl border border-line bg-white p-4 sm:p-5 ${className}`}
    >
      <h2 className="mb-1 mt-0 text-[18px] font-bold">اختار طريقة الطلب</h2>
      <p className="mb-4 mt-0 text-[13px] leading-6 text-muted">
        اختار دوناتس النهاردة أو احجز بكرة. مش هتقدر تخلط بينهم في نفس الطلب.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ mode: option, icon: Icon, description }) => {
          const selected = mode === option;
          return (
            <button
              key={option}
              type="button"
              disabled={!hasHydrated}
              aria-pressed={selected}
              onClick={() => choose(option)}
              className={`flex min-h-[110px] flex-col items-start gap-1 rounded-lg border p-4 text-right transition-colors disabled:opacity-60 ${
                selected
                  ? "border-brand bg-brand-light"
                  : "border-line bg-white hover:border-brand-accent"
              }`}
            >
              <span className="flex items-center gap-2 text-[15px] font-bold text-brand">
                <Icon className="size-5" aria-hidden="true" />
                {ORDER_MODE_LABELS[option]}
              </span>
              <span className="text-[13px] leading-6 text-[#493a34]">
                {description}
              </span>
              {dates && (
                <span className="mt-auto text-[12px] text-muted">
                  تاريخ الاستلام:{" "}
                  {option === "today" ? dates.today : dates.tomorrow}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {pendingMode && (
        <SwitchConfirmation
          next={pendingMode}
          onCancel={() => setPendingMode(null)}
          onConfirm={confirmSwitch}
        />
      )}
    </section>
  );
}

function SwitchConfirmation({
  next,
  onCancel,
  onConfirm,
}: {
  next: OrderMode;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="mt-3 rounded-md border border-[#e8c79a] bg-[#fff6e8] p-3"
      role="alertdialog"
      aria-label="تأكيد تغيير نوع الطلب"
    >
      <p className="m-0 text-[13px] leading-6 text-[#72511f]">
        السلة فيها منتجات من{" "}
        {ORDER_MODE_LABELS[next === "today" ? "preorder" : "today"]}. تغيير
        النوع هيفرغ السلة. هل تريد المتابعة؟
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-9 rounded-md bg-brand px-3 text-[12px] font-semibold text-white hover:bg-brand-hover"
        >
          إفراغ السلة وتغيير النوع
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-9 rounded-md border border-line bg-white px-3 text-[12px] font-semibold text-warm"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
