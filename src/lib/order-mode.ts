export type OrderMode = "today" | "preorder";

export const ORDER_MODE_LABELS: Record<OrderMode, string> = {
  today: "دوناتس النهاردة",
  preorder: "هحجز بكرة",
};

export const ORDER_TYPE_LABELS: Record<OrderMode, string> = {
  today: "دوناتس النهاردة",
  preorder: "حجز لبكرة",
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Business date in Egypt (Africa/Cairo), never the visitor's browser timezone. */
export function cairoBusinessDate(offsetDays = 0): string {
  const today = dateFormatter.format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + offsetDays));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function isOrderMode(value: unknown): value is OrderMode {
  return value === "today" || value === "preorder";
}
