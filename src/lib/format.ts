export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 2,
  }).format(value)} ج.م`;
}

export function productName(name: string): string {
  const names: Record<string, string> = {
    "دونتس رافايللو": "دونات رافايللو",
    "دونتس لوتس": "دونات لوتس",
    "دونتس توت": "دونات التوت",
    "دونتس فسدق": "دونات فستق",
    "دونتس بوسطن كريم": "دونات بوسطن كريم",
    "دونتس نوتيلا فسدق": "دونات نوتيلا بالفستق",
    "دونتس أوريو": "دونات أوريو",
  };
  return names[name] ?? name;
}
