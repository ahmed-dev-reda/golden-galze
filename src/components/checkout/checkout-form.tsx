"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/providers/cart-provider";
import {
  ALLOWED_SCREENSHOT_TYPES,
  MAX_SCREENSHOT_SIZE,
} from "@/lib/constants";
import { formatPrice, productName } from "@/lib/format";
import { createOrder } from "@/app/actions/orders";
import { PaymentProofUpload } from "@/components/checkout/payment-proof-upload";
import type { PublicStoreSettings } from "@/lib/public-store-settings";

export function CheckoutForm({ settings }: { settings: PublicStoreSettings }) {
  const router = useRouter();
  const { items, total, hydrated, clearCart } = useCart();
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "instapay">(
    settings.cashOnDeliveryEnabled ? "cash" : "instapay",
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("السلة فاضية. ضيف منتجات الأول.");
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    data.set(
      "items",
      JSON.stringify(items.map(({ id, quantity }) => ({ id, quantity }))),
    );
    data.set("paymentMethod", paymentMethod);

    if (paymentMethod === "instapay") {
      const screenshot = data.get("screenshot");
      if (!(screenshot instanceof File) || screenshot.size === 0) {
        setError("من فضلك ارفع صورة التحويل.");
        return;
      }
      if (
        !ALLOWED_SCREENSHOT_TYPES.includes(screenshot.type) ||
        screenshot.size > MAX_SCREENSHOT_SIZE
      ) {
        setError("ارفع صورة PNG أو JPG أو WEBP، وحجمها أقل من 5 ميجابايت.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await createOrder(data);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      clearCart();
      router.push(
        `/order-confirmation?id=${encodeURIComponent(result.orderId)}${result.proofWarning ? "&proof=missing" : ""}`,
      );
    } catch {
      setError("تعذر الاتصال. راجع الإنترنت وحاول تاني.");
    } finally {
      setSubmitting(false);
    }
  }

  const canOrder =
    settings.orderingEnabled &&
    settings.deliveryAreas.length > 0 &&
    (settings.cashOnDeliveryEnabled || settings.instapayEnabled);
  const deliveryFee = settings.deliveryFees[city] ?? settings.deliveryFee;

  if (!hydrated)
    return (
      <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
        لحظة بنجهز بيانات الطلب...
      </main>
    );
  if (items.length === 0) {
    return (
      <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
        <div className="mx-auto max-w-xl rounded-xl border border-[#eee7e1] bg-white px-5 py-10 text-center">
          <h1 className="my-2 text-2xl font-bold">مفيش منتجات في السلة</h1>
          <p className="mb-5 text-[#82736b]">
            اختار الدونات الأول وبعدها كمّل الطلب.
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#cb607a] px-5 font-semibold text-white hover:bg-[#b94f69]"
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
      <h1 className="mb-6 text-[27px] font-bold">بيانات التوصيل والدفع</h1>
      {!settings.orderingEnabled && (
        <p className="mb-5 rounded-md bg-[#fff0f0] p-3 text-sm text-[#8d2939]" role="status">
          {settings.closedMessage || "الطلبات متوقفة مؤقتًا. حاول مرة أخرى لاحقًا."}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,.7fr)]">
        <form
          className="rounded-[10px] border border-[#eee7e1] bg-white p-4 sm:p-5"
          onSubmit={submit}
        >
          {error && (
            <p
              className="mb-3 rounded-md bg-[#fff0f0] p-3 text-[13px] text-[#8d2939]"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-[#493a34]"
                htmlFor="name"
              >
                الاسم
              </label>
              <input
                className="min-h-[43px] w-full rounded-md border border-[#e8dfd9] bg-white px-3 py-2"
                id="name"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-[#493a34]"
                htmlFor="phone"
              >
                رقم الموبايل
              </label>
              <input
                className="min-h-[43px] w-full rounded-md border border-[#e8dfd9] bg-white px-3 py-2"
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                minLength={8}
                maxLength={20}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-[#493a34]"
                htmlFor="alternatePhone"
              >
                رقم موبايل بديل (اختياري)
              </label>
              <input
                className="min-h-[43px] w-full rounded-md border border-[#e8dfd9] bg-white px-3 py-2"
                id="alternatePhone"
                name="alternatePhone"
                type="tel"
                inputMode="tel"
                maxLength={20}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-semibold text-[#493a34]"
                htmlFor="city"
              >
                المحافظة
              </label>
              <select
                className="min-h-[43px] w-full rounded-md border border-[#e8dfd9] bg-white px-3 py-2"
                id="city"
                name="city"
                required
                defaultValue=""
                onChange={(event) => setCity(event.target.value)}
              >
                <option value="" disabled>
                  اختار المحافظة
                </option>
                {settings.deliveryAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              {settings.deliveryAreas.length === 0 && (
                <p className="text-xs text-[#8d2939]" role="status">
                  لا توجد مناطق توصيل متاحة حاليًا.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                className="text-[13px] font-semibold text-[#493a34]"
                htmlFor="address"
              >
                العنوان بالتفصيل
              </label>
              <textarea
                className="min-h-[86px] w-full resize-y rounded-md border border-[#e8dfd9] bg-white px-3 py-2"
                id="address"
                name="address"
                required
                minLength={8}
                maxLength={500}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label
                className="text-[13px] font-semibold text-[#493a34]"
                htmlFor="notes"
              >
                ملاحظات الطلب (اختياري)
              </label>
              <textarea
                className="min-h-[86px] w-full resize-y rounded-md border border-[#e8dfd9] bg-white px-3 py-2"
                id="notes"
                name="notes"
                maxLength={500}
              />
            </div>
            <fieldset className="m-0 border-0 p-0 sm:col-span-2">
              <legend className="mb-2 text-[13px] font-semibold text-[#493a34]">
                طريقة الدفع
              </legend>
              <div className="grid gap-2">
                {settings.cashOnDeliveryEnabled && (
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[#eee7e1] p-2.5">
                    <input
                      type="radio"
                      name="paymentChoice"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                    />
                    <span>الدفع عند الاستلام</span>
                  </label>
                )}
                {settings.instapayEnabled ? (
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[#eee7e1] p-2.5">
                    <input
                      type="radio"
                      name="paymentChoice"
                      value="instapay"
                      checked={paymentMethod === "instapay"}
                      onChange={() => setPaymentMethod("instapay")}
                    />
                    <span>InstaPay</span>
                  </label>
                ) : null}
                {!settings.cashOnDeliveryEnabled && !settings.instapayEnabled ? (
                  <p className="m-0 rounded-md bg-[#faf6f2] p-3 text-xs leading-6 text-[#82736b]">
                    لا توجد طرق دفع متاحة حاليًا.
                  </p>
                ) : null}
              </div>
            </fieldset>
            {paymentMethod === "instapay" && settings.instapayEnabled && (
              <>
                <p className="rounded-md bg-[#faf6f2] p-3 text-sm leading-6 text-[#493a34] sm:col-span-2">
                  حوّل المبلغ إلى حساب InstaPay:{" "}
                  <b dir="ltr">{settings.instapayAccount}</b>
                </p>
                <PaymentProofUpload />
              </>
            )}
          </div>
          <p className="my-3 text-xs leading-6 text-[#82736b]">
            رسوم التوصيل {formatPrice(deliveryFee)}، وسيُحسب الإجمالي
            النهائي من قاعدة البيانات وقت تأكيد الطلب.
          </p>
          <button
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-[#cb607a] px-5 font-semibold text-white hover:bg-[#b94f69] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={submitting || !canOrder}
          >
            {submitting ? "جاري تأكيد الطلب..." : "تأكيد الطلب"}
          </button>
        </form>

        <aside className="rounded-[10px] border border-[#eee7e1] bg-white p-4 sm:p-5">
          <div>
            <h2 className="mb-4 mt-0 text-[17px] font-semibold">ملخص طلبك</h2>
            {items.map((item) => (
              <div
                className="my-3 flex justify-between gap-3 text-sm text-[#6f5f57]"
                key={item.id}
              >
                <span>
                  {productName(item.name)} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="my-3 flex justify-between gap-3 border-t border-[#eee7e1] pt-3 text-sm">
              <span>التوصيل</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <div className="my-3 flex justify-between gap-3 border-t border-[#eee7e1] pt-3 text-base font-bold">
              <span>الإجمالي المبدئي</span>
              <span>{formatPrice(total + deliveryFee)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
