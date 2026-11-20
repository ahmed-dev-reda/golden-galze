import { Suspense } from "react";
import { CategoryPage } from "@/components/products/category-page";
import { DONUT_CATEGORIES } from "@/lib/constants";

export default function FilledDonutsPage() {
  return (
    <Suspense fallback={<main className="mx-auto min-h-[55vh] w-[calc(100%-2rem)] max-w-6xl py-10">بنجهز الدونات المحشية...</main>}>
      <CategoryPage
        category={DONUT_CATEGORIES.filled}
        title="الدونات المحشية"
        description="اختار نكهتك المفضلة من الدونات المحشية الطازة."
      />
    </Suspense>
  );
}
