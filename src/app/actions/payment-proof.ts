"use server";

import { cookies } from "next/headers";
import {
  getPaymentProofCookieName,
  isPaymentProofAccessConfigured,
  isValidPaymentProofAccessToken,
} from "@/lib/payment-proof-access";
import { createServerSupabase } from "@/lib/supabase";

const ORDER_ID_PATTERN = /^[0-9a-f-]{36}$/i;
const PROOF_FILE_PATTERN = /^[0-9a-f-]{36}\.(png|jpg|webp)$/i;

export async function getCustomerPaymentProof(
  orderId: string,
): Promise<string | null> {
  if (!ORDER_ID_PATTERN.test(orderId)) return null;
  if (!isPaymentProofAccessConfigured()) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(getPaymentProofCookieName(orderId))?.value;
  if (!token || !isValidPaymentProofAccessToken(token, orderId)) return null;

  const supabase = await createServerSupabase();
  const { data: files, error: listError } = await supabase.storage
    .from("payment_proof")
    .list(orderId, { limit: 10 });
  if (listError) {
    console.error("Unable to list customer payment proof files.", listError);
    return null;
  }
  const file = files?.find((item) => PROOF_FILE_PATTERN.test(item.name));
  if (!file) return null;

  const { data: image, error: downloadError } = await supabase.storage
    .from("payment_proof")
    .download(`${orderId}/${file.name}`);
  if (downloadError || !image) {
    console.error("Unable to download customer payment proof.", downloadError);
    return null;
  }

  return toImageDataUrl(image, file.name);
}

async function toImageDataUrl(image: Blob, fileName: string): Promise<string> {
  const type = ["image/png", "image/jpeg", "image/webp"].includes(image.type)
    ? image.type
    : fileName.endsWith(".png")
      ? "image/png"
      : fileName.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
  const bytes = new Uint8Array(await image.arrayBuffer());
  return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
}
