import { Suspense } from "react";
import { OrderModeSelector } from "@/components/welcome/buttons";
import { cairoBusinessDate } from "@/lib/order-mode";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "./product-skeleton-grid";
import { connection } from "next/server";

export async function CategoryPage({
  category,
  title,
  description,
}: {
  category: string;
  title: string;
  description: string;
}) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <CategoryContent category={category} title={title} description={description} />
    </Suspense>
  );
}

async function CategoryContent({
  category,
  title,
  description,
}: {
  category: string;
  title: string;
  description: string;
}) {
  await connection();
  return (
    <main className="mx-auto min-h-[55vh] w-[calc(100%-2rem)] max-w-6xl py-7 sm:py-10">
      <header className="mb-6">
        <p className="m-0 text-[13px] font-semibold text-brand">
          طازة مخصوص ليك
        </p>
        <h1 className="mb-1 mt-1 text-[26px] font-bold sm:text-[29px]">
          {title}
        </h1>
        <p className="m-0 text-sm text-muted">{description}</p>
      </header>
      <OrderModeSelector
        compact
        className="mb-5"
        todayDate={cairoBusinessDate()}
        tomorrowDate={cairoBusinessDate(1)}
      />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid category={category} />
      </Suspense>
    </main>
  );
}
