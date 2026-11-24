import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { createClient } from "@/utils/supabase/server";
import { parseStorefrontSettings } from "@/lib/storefront-settings";
import { connection } from "next/server";
import { cairoBusinessDate } from "@/lib/order-mode";
import { getPreorderDateOptions } from "@/lib/preorder-dates";

function CheckoutLoading() {
  return (
    <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
      <p
        className="rounded-lg border border-line bg-white p-5 text-sm"
        role="status"
      >
        جارٍ تحميل إعدادات التوصيل والدفع...
      </p>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_storefront_settings");

  if (error) {
    console.error("Unable to load checkout settings.", {
      code: error.code,
      message: error.message,
    });
    return (
      <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
        <p
          className="rounded-lg border border-line bg-white p-5 text-sm"
          role="alert"
        >
          تعذر تحميل إعدادات التوصيل والدفع. حاول تحديث الصفحة بعد قليل.
        </p>
      </main>
    );
  }

  const settings = parseStorefrontSettings(data);
  if (!settings) {
    console.error("Storefront settings returned an unexpected response.");
    return (
      <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
        <p
          className="rounded-lg border border-line bg-white p-5 text-sm"
          role="alert"
        >
          إعدادات الطلب غير مكتملة حاليًا. يرجى التواصل مع المتجر.
        </p>
      </main>
    );
  }

  return (
    <CheckoutForm
      settings={settings}
      todayDate={cairoBusinessDate()}
      preorderDates={getPreorderDateOptions()}
    />
  );
}
