import "server-only";

import { connection } from "next/server";
import { DONUT_CATEGORIES } from "@/lib/constants";
import { createServerSupabase } from "@/lib/supabase";
import type { Donut } from "@/lib/types";

type DonutRow = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  is_available: boolean;
  category: string;
  created_at: string;
};

function mapDonut(row: DonutRow): Donut {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
    price: Number(row.price),
    isAvailable: row.is_available,
    category: row.category,
    createdAt: row.created_at,
  };
}

export async function getDonuts(category?: string): Promise<Donut[]> {
  await connection();

  let query = (await createServerSupabase())
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
  return (data as DonutRow[]).map(mapDonut);
}

export function categoryForSlug(slug: string): string | null {
  if (slug === "filled-donuts") return DONUT_CATEGORIES.filled;
  if (slug === "mini-donuts") return DONUT_CATEGORIES.mini;
  return null;
}
