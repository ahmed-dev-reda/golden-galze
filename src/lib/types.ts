export type Donut = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  category: string;
  createdAt: string;
};

export type CartItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

export type PaymentMethod = "cash" | "instapay";
