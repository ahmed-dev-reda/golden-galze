import { Suspense } from "react";
import { connection } from "next/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getPublicStoreSettings } from "@/lib/public-store-settings";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">لحظة بنجهز بيانات الطلب...</main>}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  await connection();
  const settings = await getPublicStoreSettings();
  return <CheckoutForm settings={settings} />;
}
