export function shortOrderId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
