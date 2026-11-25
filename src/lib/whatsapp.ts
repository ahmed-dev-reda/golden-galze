/** Build a WhatsApp click-to-chat URL from the store's public settings. */
export function buildWhatsAppUrl(
  rawPhone: string,
  message: string,
): string | null {
  const phone = rawPhone.replace(/\D/g, "");
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
