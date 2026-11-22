"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { formatPrice } from "@/lib/format";

type OrderSummary = {
  orderId: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "cash" | "instapay";
  receiptUploaded: boolean;
};

const confirmationStorageKey = "golden-glaze-last-order";
const serverSnapshot = "__server-render__";

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getStoredSummary() {
  return sessionStorage.getItem(confirmationStorageKey) ?? "";
}

function getServerSummary() {
  return serverSnapshot;
}

function parseSummary(value: unknown): OrderSummary | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.orderId !== "string" ||
    typeof record.subtotal !== "number" ||
    !Number.isFinite(record.subtotal) ||
    record.subtotal < 0 ||
    typeof record.deliveryFee !== "number" ||
    !Number.isFinite(record.deliveryFee) ||
    record.deliveryFee < 0 ||
    typeof record.total !== "number" ||
    !Number.isFinite(record.total) ||
    record.total < 0 ||
    (record.paymentMethod !== "cash" && record.paymentMethod !== "instapay") ||
    typeof record.receiptUploaded !== "boolean"
  ) {
    return null;
  }
  return record as OrderSummary;
}

export function OrderConfirmation({
  orderId,
  receiptStatus,
}: {
  orderId: string;
  receiptStatus: string;
}) {
  const savedSummary = useSyncExternalStore(
    subscribeToStorage,
    getStoredSummary,
    getServerSummary,
  );
  const summary = useMemo(() => {
    if (!savedSummary || savedSummary === serverSnapshot) return null;
    try {
      const parsed = parseSummary(JSON.parse(savedSummary) as unknown);
      return parsed?.orderId === orderId ? parsed : null;
    } catch (error) {
      console.error("Unable to read the order confirmation summary.", error);
      return null;
    }
  }, [orderId, savedSummary]);

  if (!orderId) {
    return (
      <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
        <div className="mx-auto max-w-xl rounded-xl border border-line bg-white px-5 py-9 text-center">
          <h1 className="mb-2 mt-0 text-2xl font-bold">تأكيد الطلب</h1>
          <p className="mb-5 text-muted">
            لا يوجد رقم طلب لعرضه. يمكنك متابعة طلب قائم من صفحة التتبع.
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-hover"
            href="/track-order"
          >
            تتبع الطلب
          </Link>
        </div>
      </main>
    );
  }

  if (savedSummary === serverSnapshot) {
    return (
      <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
        <p className="mx-auto max-w-xl rounded-lg border border-line bg-white p-5 text-sm" role="status">
          جارٍ تحميل تأكيد الطلب...
        </p>
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
        <div className="mx-auto max-w-xl rounded-xl border border-line bg-white px-5 py-9 text-center">
          <h1 className="mb-2 mt-0 text-2xl font-bold">بيانات التأكيد غير متاحة</h1>
          <p className="mb-5 text-muted">
            لم نعثر على تفاصيل تأكيد محفوظة لهذا الطلب. أدخل رقم الطلب ورقم الهاتف في صفحة التتبع للتحقق من حالته.
          </p>
          <p className="mb-5 break-all rounded-md bg-page p-3 text-sm font-semibold" dir="ltr">
            {orderId}
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-hover"
            href="/track-order"
          >
            تتبع الطلب
          </Link>
        </div>
      </main>
    );
  }

  const receiptFailed =
    receiptStatus === "failed" &&
    summary.paymentMethod === "instapay" &&
    !summary.receiptUploaded;

  return (
    <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
      <div className="mx-auto my-5 max-w-xl rounded-xl border border-line bg-white px-5 py-9 text-center">
        <div
          className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-brand-light text-3xl text-brand"
          aria-hidden="true"
        >
          ✓
        </div>
        <h1 className="mb-2 mt-0 text-2xl font-bold">تم استلام طلبك</h1>
        <p className="mb-3 text-muted">
          احتفظ برقم الطلب لمتابعة حالته.
        </p>
        <p
          className="mb-5 break-all rounded-md bg-page p-3 text-sm font-semibold"
          dir="ltr"
        >
          {orderId}
        </p>

        {receiptFailed && (
          <p className="mb-5 rounded-md bg-[#fff6e8] p-3 text-sm leading-6 text-[#72511f]" role="alert">
            تم تسجيل الطلب، لكن تعذر اعتماد صورة تحويل InstaPay. يرجى الاحتفاظ برقم الطلب والتواصل مع المتجر لإكمال الدفع.
          </p>
        )}

        {summary?.orderId === orderId && (
          <div className="mb-5 space-y-2 border-y border-line py-4 text-sm">
            <div className="flex justify-between gap-3">
              <span>المنتجات</span>
              <span>{formatPrice(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>التوصيل</span>
              <span>{formatPrice(summary.deliveryFee)}</span>
            </div>
            <div className="flex justify-between gap-3 text-base font-bold">
              <span>الإجمالي</span>
              <span>{formatPrice(summary.total)}</span>
            </div>
            <p className="mb-0 pt-1 text-muted">
              طريقة الدفع:{" "}
              {summary.paymentMethod === "cash"
                ? "الدفع عند الاستلام"
                : summary.receiptUploaded
                  ? "InstaPay - تم رفع الإيصال"
                  : "InstaPay"}
            </p>
          </div>
        )}

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 font-semibold text-white hover:bg-brand-hover"
            href="/track-order"
          >
            تتبع الطلب
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-soft-surface px-5 font-semibold text-warm"
            href="/"
          >
            العودة للتسوق
          </Link>
        </div>
      </div>
    </main>
  );
}
