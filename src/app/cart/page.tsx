import { Suspense } from "react";
import { connection } from "next/server";
import { CartPage } from "@/components/cart/cart-page";
import { cairoBusinessDate } from "@/lib/order-mode";

export default function CartRoute() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
          <p className="text-sm text-muted">جارٍ تحميل السلة...</p>
        </main>
      }
    >
      <CartContent />
    </Suspense>
  );
}

async function CartContent() {
  await connection();
  return (
    <CartPage
      todayDate={cairoBusinessDate()}
      tomorrowDate={cairoBusinessDate(1)}
    />
  );
}
