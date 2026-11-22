"use client";

import { useState, type FormEvent } from "react";
import { trackGuestOrder, type TrackOrderResult } from "@/app/actions/orders";
import { formatPrice, productName } from "@/lib/format";

const fieldClass =
  "min-h-[43px] w-full rounded-md border border-field-line bg-white px-3 py-2";
const statusLabels: Record<string, string> = {
  PENDING: "قيد المراجعة",
  CONFIRMED: "تم تأكيد الطلب",
  PREPARING: "جارٍ التحضير",
  OUT_FOR_DELIVERY: "في الطريق إليك",
  DELIVERED: "تم التوصيل",
  CANCELLED: "تم إلغاء الطلب",
};

function paymentLabel(method: string): string {
  if (method === "cash") return "الدفع عند الاستلام";
  if (method === "instapay") return "InstaPay";
  return method;
}

export function TrackOrderForm() {
  const [result, setResult] = useState<TrackOrderResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await trackGuestOrder(new FormData(event.currentTarget));
      setResult(response);
    } catch (error) {
      console.error("Order tracking request failed.", error);
      setResult({
        ok: false,
        message: "تعذر الاتصال بالخادم. حاول مرة أخرى بعد قليل.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label
          className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#493a34]"
          htmlFor="order-id"
        >
          رقم الطلب
          <input
            className={fieldClass}
            id="order-id"
            name="orderId"
            dir="ltr"
            autoComplete="off"
            required
            aria-describedby="tracking-help"
          />
        </label>
        <label
          className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#493a34]"
          htmlFor="tracking-phone"
        >
          رقم الهاتف المسجل على الطلب
          <input
            className={fieldClass}
            id="tracking-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
          />
        </label>
        <p id="tracking-help" className="m-0 text-xs leading-6 text-muted">
          رقم الطلب هو الرمز الكامل الظاهر في رسالة تأكيد الطلب.
        </p>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "جارٍ البحث..." : "تتبع الطلب"}
        </button>
      </form>

      {result && !result.ok && (
        <p className="mt-4 rounded-md bg-[#fff1f1] p-3 text-sm text-[#9b2939]" role="alert">
          {result.message}
        </p>
      )}

      {result?.ok && (
        <section
          className="mt-6 rounded-lg border border-line bg-page p-4"
          aria-live="polite"
          aria-label="حالة الطلب"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-xs text-muted">رقم الطلب</p>
              <p className="mt-1 break-all font-semibold" dir="ltr">
                {result.order.orderId}
              </p>
            </div>
            <p className="m-0 rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand">
              {statusLabels[result.order.status.toUpperCase()] ??
                result.order.status}
            </p>
          </div>

          <p className="mb-3 mt-4 text-sm">
            تاريخ الطلب:{" "}
            {Number.isNaN(Date.parse(result.order.createdAt))
              ? "غير متاح"
              : new Intl.DateTimeFormat("ar-EG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(result.order.createdAt))}
          </p>
          <p className="mb-3 text-sm">
            طريقة الدفع: {paymentLabel(result.order.paymentMethod)}
          </p>
          {result.order.paymentMethod === "instapay" && (
            <p className="mb-3 text-sm">
              إثبات الدفع: {result.order.paymentProof ? "تم استلامه" : "بانتظار الإيصال"}
            </p>
          )}

          {result.order.items.length > 0 && (
            <ul className="m-0 list-none space-y-2 border-t border-line pt-3">
              {result.order.items.map((item, index) => (
                <li
                  className="flex justify-between gap-3 text-sm"
                  key={`${item.name}-${index}`}
                >
                  <span>
                    {productName(item.name)} × {item.quantity}
                  </span>
                  <span className="shrink-0">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-bold">
            <span>الإجمالي</span>
            <span>{formatPrice(result.order.total)}</span>
          </div>
        </section>
      )}
    </div>
  );
}
