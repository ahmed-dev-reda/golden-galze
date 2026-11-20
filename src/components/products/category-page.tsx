import { ProductGrid } from "@/components/products/product-grid";
import { getDonuts } from "@/lib/products";

export async function CategoryPage({
  category,
  title,
  description,
}: {
  category: string;
  title: string;
  description: string;
}) {
  const donuts = await getDonuts(category);
  return (
    <main className="mx-auto min-h-[55vh] w-[calc(100%-2rem)] max-w-6xl py-7 sm:py-10">
      <header className="mb-6">
        <p className="m-0 text-[13px] font-semibold text-[#cb607a]">طازة مخصوص ليك</p>
        <h1 className="mb-1 mt-1 text-[26px] font-bold sm:text-[29px]">{title}</h1>
        <p className="m-0 text-sm text-[#82736b]">{description}</p>
      </header>
      <ProductGrid donuts={donuts} />
    </main>
  );
}
