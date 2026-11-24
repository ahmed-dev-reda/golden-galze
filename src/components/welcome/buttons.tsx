"use client";

import { useState } from "react";
import { Cookie, MoonStar } from "lucide-react";
import { ORDER_MODE_LABELS, type OrderMode } from "@/lib/order-mode";
import type { PreorderDateOption } from "@/lib/preorder-dates";
import { useCartStore } from "@/store/cart-store";

type Props = {
  compact?: boolean;
  className?: string;
  todayDate: string;
  preorderDates: PreorderDateOption[];
};

const options: Array<{
  mode: OrderMode;
  icon: typeof Cookie;
  description: string;
}> = [
  {
    mode: "today",
    icon: Cookie,
    description: "الكمية بتكون على حسب المخزون",
  },
  {
    mode: "preorder",
    icon: MoonStar,
    description: "تقدر تطلب اي كمية لليوم اللي انت عاوزه",
  },
];

export function OrderModeSelector({
  compact = false,
  className = "",
  todayDate,
  preorderDates,
}: Props) {
  const mode = useCartStore((state) => state.mode);
  const setMode = useCartStore((state) => state.setMode);
  const preorderDate = useCartStore((state) => state.preorderDate);
  const setPreorderDate = useCartStore((state) => state.setPreorderDate);
  const itemCount = useCartStore((state) => state.items.length);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const [pendingMode, setPendingMode] = useState<OrderMode | null>(null);

  const activePreorderDate =
    preorderDates.find((option) => option.value === preorderDate) ??
    preorderDates[0];

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

  const datePicker =
    mode === "preorder" && preorderDates.length > 0 ? (
      <div className="mt-3" aria-label="تاريخ الاستلام">
        <p className={`mb-1.5 ${"text-[12px] font-semibold text-[#493a34]"}`}>
          اختار تاريخ الاستلام (حتى أسبوع من اليوم)
        </p>
        <div className="flex flex-wrap gap-2">
          {preorderDates.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={activePreorderDate?.value === option.value}
              onClick={() => setPreorderDate(option.value)}
              title={option.label}
              className={`min-h-9 rounded-md border px-3 text-[12px] font-semibold transition-colors ${
                activePreorderDate?.value === option.value
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-warm hover:bg-brand-light"
              }`}
            >
              {option.shortLabel}
            </button>
          ))}
        </div>
      </div>
    ) : null;

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
          <p className="m-0 mr-auto text-[12px] text-muted">
            تاريخ الاستلام:{" "}
            {mode === "today" ? todayDate : (activePreorderDate?.value ?? "—")}
          </p>
        </div>
        {datePicker}
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
        اختار دوناتس النهاردة أو احجز لمدة حتى أسبوع قادم. مش هتقدر تخلط بينهم
        في نفس الطلب.
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
            </button>
          );
        })}
      </div>

      {datePicker}
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
