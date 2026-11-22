import type { Donut } from "@/lib/types";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ProductCard } from "./product-card";

type DonutRow = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  is_available: boolean;
  category: string;
  created_at: string;
};

export async function ProductGrid({ category }: { category?: string }) {
  await connection();
  const supabase = await createClient();
  let query = supabase
    .from("donuts")
    .select("id, name, image_url, price, is_available, category, created_at")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) {
    console.error("Unable to load available donuts.", error);
    throw new Error("تعذر تحميل الدونات. حاول مرة تانية بعد شوية.");
  }

  const donuts: Donut[] = (data as DonutRow[]).map((donut) => ({
    id: donut.id,
    name: donut.name,
    imageUrl: donut.image_url,
    price: Number(donut.price),
    isAvailable: donut.is_available,
    category: donut.category,
    createdAt: donut.created_at,
  }));

  if (donuts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e6d9d1] px-5 py-14 text-center">
        <span className="text-3xl text-brand-accent" aria-hidden="true">
          ♡
        </span>
        <h3 className="mb-2 mt-2 text-lg font-semibold">
          مفيش منتجات متاحة دلوقتي
        </h3>
        <p className="m-0 text-sm text-muted">
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
