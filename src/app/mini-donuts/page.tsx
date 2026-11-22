import { CategoryPage } from "@/components/products/category-page";
import { DONUT_CATEGORIES } from "@/lib/constants";

export default function MiniDonutsPage() {
  return (
    <CategoryPage
      category={DONUT_CATEGORIES.mini}
      title="الميني دونات"
      description="قطع صغيرة ولذيذة، مناسبة للمشاركة."
    />
  );
}
