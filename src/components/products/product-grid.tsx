import type { Donut } from "@/lib/types";
import { ProductCard } from "./product-card";

export function ProductGrid({ donuts }: { donuts: Donut[] }) {
  if (donuts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e6d9d1] px-5 py-14 text-center">
        <span className="text-3xl text-[#e9859b]" aria-hidden="true">
          ♡
        </span>
        <h3 className="mb-2 mt-2 text-lg font-semibold">
          مفيش منتجات متاحة دلوقتي
        </h3>
        <p className="m-0 text-sm text-[#82736b]">
          تابعنا، هنضيف منتجات جديدة قريب.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 lg:gap-5">
      {donuts.map((donut) => (
        <ProductCard key={donut.id} donut={donut} />
      ))}
    </div>
  );
}
