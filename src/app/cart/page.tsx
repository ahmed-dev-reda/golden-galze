import { Suspense } from "react";
import { connection } from "next/server";
import { CartPage } from "@/components/cart/cart-page";
import { CartPageSkeleton } from "@/components/cart/cart-page-skeleton";
import { cairoBusinessDate } from "@/lib/order-mode";
import { getPreorderDateOptions } from "@/lib/preorder-dates";

export default function CartRoute() {
  return (
    <Suspense fallback={<CartPageSkeleton />}>
      <CartContent />
    </Suspense>
  );
}

async function CartContent() {
  await connection();
  return (
    <CartPage
      todayDate={cairoBusinessDate()}
      preorderDates={getPreorderDateOptions()}
    />
  );
}
