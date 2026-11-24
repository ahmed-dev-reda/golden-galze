export type Donut = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  category: string;
  createdAt: string;
  /** today_stock from Supabase (numeric). NULL means no stock available. */
  todayStock: number | null;
};
