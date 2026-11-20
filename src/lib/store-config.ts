export function getWhatsAppLink(value: string): string | null {
  const contact = value.trim();
  if (!contact) return null;
  if (/^https?:\/\//i.test(contact)) return contact;
  const number = contact.replace(/[^0-9]/g, "");
  return number ? `https://wa.me/${number}` : null;
}
