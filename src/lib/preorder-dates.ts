import { cairoBusinessDate } from "./order-mode";

export const MAX_PREORDER_DAYS = 7;

export type PreorderDateOption = {
  value: string;
  label: string;
  shortLabel: string;
};

/** Server-side helper: tomorrow through one week ahead, in Egypt time. */
export function getPreorderDateOptions(): PreorderDateOption[] {
  return Array.from({ length: MAX_PREORDER_DAYS }, (_, index) => index + 1).map(
    (days) => {
      const value = cairoBusinessDate(days);
      const date = new Date(`${value}T12:00:00Z`);
      return {
        value,
        label: new Intl.DateTimeFormat("ar-EG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        }).format(date),
        shortLabel: new Intl.DateTimeFormat("ar-EG", {
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        }).format(date),
      };
    },
  );
}

export function daysBetweenCairoDates(from: string, to: string): number {
  const parse = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parse(to) - parse(from)) / 86400000);
}
