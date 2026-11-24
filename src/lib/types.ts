export type Donut = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  category: string;
  createdAt: string;
  /** today_stock from Supabase; null when stock is not configured. */
  todayStock: number | null;
  /** stock_date from Supabase; null when stock is not configured. */
  stockDate: string | null;
  /** True only when stock_date matches the current Cairo business date. */
  stockIsCurrent: boolean;
};
