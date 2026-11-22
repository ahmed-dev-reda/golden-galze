import { CategoryPage } from "@/components/products/category-page";
import { DONUT_CATEGORIES } from "@/lib/constants";

export default function FilledDonutsPage() {
  return (
    <CategoryPage
      category={DONUT_CATEGORIES.filled}
      title="الدونات المحشية"
      description="اختار نكهتك المفضلة من الدونات المحشية الطازة."
    />
  );
}
