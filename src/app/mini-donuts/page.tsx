import { Suspense } from "react";
import { CategoryPage } from "@/components/products/category-page";
import { DONUT_CATEGORIES } from "@/lib/constants";

export default function MiniDonutsPage() {
  return (
    <Suspense fallback={<main className="mx-auto min-h-[55vh] w-[calc(100%-2rem)] max-w-6xl py-10">بنجهز الميني دونات...</main>}>
      <CategoryPage
        category={DONUT_CATEGORIES.mini}
        title="الميني دونات"
        description="قطع صغيرة ولذيذة، مناسبة للمشاركة."
      />
    </Suspense>
  );
}
