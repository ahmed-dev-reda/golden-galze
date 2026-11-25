/**
 * Build a WhatsApp click-to-chat URL from the store's public settings.
 * Accepts Arabic numbers, +, spaces and separators; only digits are used.
 */
export function buildWhatsAppUrl(
  rawPhone: string,
  message?: string,
): string | null {
  const phone = rawPhone.replace(/\D/g, "");
  if (!phone) return null;
  const base = `https://wa.me/${phone}`;
  return message && message.trim()
    ? `${base}?text=${encodeURIComponent(message)}`
    : base;
}

export function buildPaymentProofMessage(
  orderId: string,
  customerName: string,
): string {
  const name = customerName.trim() || "عميل جولدن جليز";
  return (
    `مرحبًا، أريد تأكيد الطلب رقم ${orderId} باسم ${name}. ` +
    "لقد أكملت تحويل InstaPay، وسأرفق صورة إثبات التحويل هنا يدويًا."
  );
}
