"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PaymentProofUpload } from "@/components/checkout/payment-proof-upload";
import {
  LocationPicker,
  type SelectedLocation,
} from "@/components/checkout/location-picker";
import { createOrder } from "@/app/actions/orders";
import { formatPrice, productName } from "@/lib/format";
import { ORDER_MODE_LABELS, type OrderMode } from "@/lib/order-mode";
import type { PreorderDateOption } from "@/lib/preorder-dates";
import type { StorefrontSettings } from "@/lib/storefront-settings";
import { selectCartSubtotal, useCartStore } from "@/store/cart-store";

type CheckoutFormProps = {
  settings: StorefrontSettings;
  todayDate: string;
  preorderDates: PreorderDateOption[];
};

const fieldClass =
  "min-h-[43px] w-full rounded-md border border-field-line bg-white px-3 py-2";
const labelClass = "text-[13px] font-semibold text-[#493a34]";
const confirmationStorageKey = "golden-glaze-last-order";
const maxAddressLength = 500;

function combineDeliveryAddress(
  city: string,
  detailed: string,
  readable: string,
): string {
  const clean = (value: string) => value.trim().replace(/\s+/g, " ");
  const cityPart = clean(city);
  const detailedPart = clean(detailed);
  let readablePart = clean(readable);

  // Nominatim often repeats the governorate; keep each piece only once but
  // never drop the customer's own detailed address.
  if (cityPart && readablePart.includes(cityPart)) {
    readablePart = readablePart
      .split(cityPart)
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/^[\s،,]+|[\s،,]+$/g, "")
      .trim();
  }

  return [
    cityPart ? `المنطقة: ${cityPart}` : "",
    detailedPart ? `العنوان التفصيلي: ${detailedPart}` : "",
    readablePart ? `الموقع على الخريطة: ${readablePart}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function CheckoutForm({ settings, todayDate, preorderDates }: CheckoutFormProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const subtotal = useCartStore(selectCartSubtotal);
  const mode = useCartStore((state) => state.mode);
  const preorderDate = useCartStore((state) => state.preorderDate);
  const clearCart = useCartStore((state) => state.clearCart);
  const [city, setCity] = useState(settings.deliveryAreas[0] ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "instapay">(
    settings.cashOnDeliveryEnabled ? "cash" : "instapay",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const selectedFulfillmentDate =
    mode === "preorder"
      ? (preorderDates.find((option) => option.value === preorderDate)?.value ??
        preorderDates[0]?.value ??
        todayDate)
      : todayDate;

  const stockIsValid =
    mode === "preorder" ||
    items.every(
      (item) => item.stockLimit !== null && item.quantity <= item.stockLimit,
    );

  const deliveryFee = city
    ? (settings.deliveryFees[city] ?? settings.deliveryFee)
    : 0;
  const total = subtotal + deliveryFee;
  const hasPaymentMethod =
    settings.cashOnDeliveryEnabled || settings.instapayEnabled;
  const canSubmit =
    settings.orderingEnabled &&
    hasPaymentMethod &&
    settings.deliveryAreas.length > 0 &&
    hasHydrated &&
    items.length > 0 &&
    stockIsValid &&
    selectedLocation !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!hasHydrated || items.length === 0) {
      setError("السلة فارغة. أضف منتجات قبل تأكيد الطلب.");
      return;
    }
    if (!stockIsValid) {
      setError(
        "الكمية المطلوبة أكبر من المتاح اليوم، أو لم يُحدد مخزون اليوم بعد. راجع السلة.",
      );
      return;
    }
    if (!selectedLocation) {
      setError("حدد موقع التوصيل على الخريطة قبل تأكيد الطلب.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const detailedAddress =
        typeof formData.get("address") === "string"
          ? String(formData.get("address"))
          : "";
      const fullAddress = combineDeliveryAddress(
        city,
        detailedAddress,
        selectedLocation.readableAddress,
      );
      if (fullAddress.length < 8) {
        setError("اكتب عنوان توصيل واضحًا قبل تأكيد الطلب.");
        return;
      }
      if (fullAddress.length > maxAddressLength) {
        setError(
          "العنوان الإجمالي (المنطقة + العنوان التفصيلي + الموقع على الخريطة) تجاوز 500 حرف. قصّر العنوان التفصيلي حتى يُحفظ كاملًا دون حذف أي جزء.",
        );
        return;
      }
      // Only readable text goes to p_address; no coordinates are stored.
      // The existing RPC/customer logic keeps using v_full_address.
      formData.set("address", fullAddress);
      formData.set("orderMode", mode);
      formData.set(
        "items",
        JSON.stringify(
          items.map(({ id, quantity }) => ({ id, quantity, mode })),
        ),
      );

      const result = await createOrder(formData);
      if (!result.ok && !("orderCreated" in result)) {
        setError(result.message);
        return;
      }
      const completedOrder = result;

      const receiptUploaded =
        "proofUploaded" in completedOrder && completedOrder.proofUploaded;
      try {
        sessionStorage.setItem(
          confirmationStorageKey,
          JSON.stringify({
            orderId: completedOrder.orderId,
            subtotal: completedOrder.subtotal,
            deliveryFee: completedOrder.deliveryFee,
            total: completedOrder.total,
            paymentMethod: completedOrder.paymentMethod,
            receiptUploaded,
            orderMode: mode,
            fulfillmentDate: selectedFulfillmentDate,
          }),
        );
      } catch (storageError) {
        console.error(
          "Unable to save the order confirmation summary.",
          storageError,
        );
      }
      clearCart();
      const receiptStatus =
        completedOrder.paymentMethod === "instapay"
          ? receiptUploaded
            ? "uploaded"
            : "failed"
          : "not-required";
      router.push(
        `/order-confirmation?orderId=${encodeURIComponent(completedOrder.orderId)}&receipt=${receiptStatus}`,
      );
    } catch (submitError) {
      console.error("Checkout submission failed.", submitError);
      setError("تعذر الاتصال بالخادم. لم نتمكن من تأكيد الطلب، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-7 sm:py-10">
      <h1 className="mb-2 text-[27px] font-bold">بيانات التوصيل والدفع</h1>
      <p className="mb-3 text-sm leading-7 text-muted">
        اكتب بياناتك واختار طريقة الدفع المناسبة.
      </p>
      <div className="mb-5 rounded-lg bg-brand-light px-4 py-3 text-[13px] font-semibold text-brand">
        {ORDER_MODE_LABELS[mode as OrderMode]} — تاريخ الاستلام: {selectedFulfillmentDate}
      </div>

      {!settings.orderingEnabled && (
        <p
          className="mb-5 rounded-md bg-[#fff6e8] p-3 text-sm text-[#72511f]"
          role="status"
        >
          {settings.closedMessage || "المتجر لا يستقبل الطلبات حاليًا."}
        </p>
      )}
      {!hasPaymentMethod && (
        <p
          className="mb-5 rounded-md bg-[#fff6e8] p-3 text-sm text-[#72511f]"
          role="status"
        >
          لا توجد طرق دفع متاحة حاليًا. يرجى التواصل مع المتجر.
        </p>
      )}
      {settings.deliveryAreas.length === 0 && (
        <p
          className="mb-5 rounded-md bg-[#fff6e8] p-3 text-sm text-[#72511f]"
          role="status"
        >
          مناطق التوصيل غير متاحة حاليًا.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,.7fr)]">
        <form
          className="rounded-[10px] border border-line bg-white p-4 sm:p-5"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="orderMode" value={mode} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label
              className={`flex flex-col gap-1.5 ${labelClass}`}
              htmlFor="name"
            >
              الاسم
              <input
                className={fieldClass}
                id="name"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <label
              className={`flex flex-col gap-1.5 ${labelClass}`}
              htmlFor="phone"
            >
              رقم الموبايل
              <input
                className={fieldClass}
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
              />
            </label>
            <label
              className={`flex flex-col gap-1.5 ${labelClass}`}
              htmlFor="alternate-phone"
            >
              رقم موبايل بديل (اختياري)
              <input
                className={fieldClass}
                id="alternate-phone"
                name="alternatePhone"
                type="tel"
                inputMode="tel"
              />
            </label>
            <label
              className={`flex flex-col gap-1.5 ${labelClass}`}
              htmlFor="city"
            >
              منطقة التوصيل
              <select
                className={fieldClass}
                id="city"
                name="city"
                value={city}
                onChange={(event) => setCity(event.currentTarget.value)}
                required
                disabled={settings.deliveryAreas.length === 0}
              >
                {settings.deliveryAreas.length === 0 ? (
                  <option value="">لا توجد مناطق متاحة</option>
                ) : (
                  settings.deliveryAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label
              className={`flex flex-col gap-1.5 sm:col-span-2 ${labelClass}`}
              htmlFor="address"
            >
              العنوان بالتفصيل
              <textarea
                className={`${fieldClass} min-h-[86px]`}
                id="address"
                name="address"
                minLength={8}
                maxLength={500}
                required
              />
            </label>

            <div className="sm:col-span-2">
              <LocationPicker
                value={selectedLocation}
                onChange={setSelectedLocation}
              />
            </div>

            <label
              className={`flex flex-col gap-1.5 sm:col-span-2 ${labelClass}`}
              htmlFor="notes"
            >
              ملاحظات الطلب (اختياري)
              <textarea
                className={`${fieldClass} min-h-[86px]`}
                id="notes"
                name="notes"
                maxLength={500}
              />
            </label>

            <fieldset className="m-0 border-0 p-0 sm:col-span-2">
              <legend className={`mb-2 ${labelClass}`}>طريقة الدفع</legend>
              <div className="grid gap-2">
                {settings.cashOnDeliveryEnabled && (
                  <label className="flex min-h-11 items-center gap-2 rounded-md border border-line p-2.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                    />
                    <span>الدفع عند الاستلام</span>
                  </label>
                )}

                {settings.instapayEnabled && (
                  <label className="flex min-h-11 items-center gap-2 rounded-md border border-line p-2.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="instapay"
                      checked={paymentMethod === "instapay"}
                      onChange={() => setPaymentMethod("instapay")}
                    />
                    <span>InstaPay</span>
                  </label>
                )}
              </div>
            </fieldset>

            {settings.instapayEnabled && paymentMethod === "instapay" && (
              <div className="sm:col-span-2">
                <p className="rounded-md bg-[#faf6f2] p-3 text-sm leading-6 text-[#493a34]">
                  حوّل على حساب InstaPay:{" "}
                  <b dir="ltr" className="inline-block">
                    {settings.instapayAccount}
                  </b>
                </p>
                <PaymentProofUpload required />
              </div>
            )}
          </div>

          {error && (
            <p
              className="mt-4 rounded-md bg-[#fff1f1] p-3 text-sm text-[#9b2939]"
              role="alert"
            >
              {error}
            </p>
          )}

          {!stockIsValid && (
            <p className="mt-4 text-[12px] text-[#8a5a1f]" role="status">
              الكمية المطلوبة غير متاحة اليوم، أو لم يُحدد مخزون اليوم بعد.
            </p>
          )}
          {!selectedLocation && (
            <p className="mt-4 text-[12px] text-[#8a5a1f]" role="status">
              يجب تحديد موقع التوصيل على الخريطة قبل تأكيد الطلب.
            </p>
          )}
          <button
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand px-5 font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            type="submit"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "جارٍ تأكيد الطلب..." : "تأكيد الطلب"}
          </button>
        </form>

        <aside className="rounded-[10px] border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-4 mt-0 text-[17px] font-semibold">ملخص طلبك</h2>
          {!hasHydrated ? (
            <p className="text-sm text-muted">جارٍ استرجاع محتويات السلة...</p>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted">
              <p>لا توجد منتجات في السلة.</p>
              <Link
                className="font-semibold text-brand hover:underline"
                href="/"
              >
                اختار الدونات اللي بتحبها
              </Link>
            </div>
          ) : (
            <>
              <ul className="m-0 list-none space-y-3 p-0">
                {items.map((item) => (
                  <li
                    className="flex justify-between gap-3 text-sm"
                    key={item.id}
                  >
                    <span>
                      {productName(item.name)} × {item.quantity}
                    </span>
                    <span className="shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="my-3 flex justify-between gap-3 border-t border-line pt-3 text-sm">
                <span>المنتجات</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="my-3 flex justify-between gap-3 border-t border-line pt-3 text-sm">
                <span>التوصيل</span>
                <span>{city ? formatPrice(deliveryFee) : "—"}</span>
              </div>
              <div className="my-3 flex justify-between gap-3 border-t border-line pt-3 text-base font-bold">
                <span>الإجمالي</span>
                <span>{formatPrice(total)}</span>
              </div>
            </>
          )}
          <Link
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-soft-surface px-5 font-semibold text-warm"
            href="/cart"
          >
            تعديل السلة
          </Link>
        </aside>
      </div>
    </main>
  );
}
