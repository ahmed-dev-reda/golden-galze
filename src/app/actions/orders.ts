"use server";

import { cookies } from "next/headers";
import {
  ALLOWED_SCREENSHOT_TYPES,
  MAX_CART_QUANTITY,
  MAX_SCREENSHOT_SIZE,
} from "@/lib/constants";
import {
  createPaymentProofAccessToken,
  getPaymentProofCookieName,
  isPaymentProofAccessConfigured,
  PAYMENT_PROOF_ACCESS_SECONDS,
} from "@/lib/payment-proof-access";
import { createServerSupabase } from "@/lib/supabase";

type RequestedItem = { id: string; quantity: number };

export type OrderActionResult =
  | { orderId: string; total: number; proofWarning?: boolean }
  | { error: string };

export type TrackedOrderItem = {
  name: string;
  quantity: number;
  unit_price: number;
};

export type TrackedOrder = {
  id: string;
  created_at: string;
  status: string;
  delivered_at: string | null;
  total: number;
  payment_method: string;
  payment_proof: boolean;
  items: TrackedOrderItem[];
};

export type TrackOrderResult =
  | { order: TrackedOrder }
  | { error: "invalid" | "unavailable" };

const PAYMENT_PROOF_BUCKET = "payment_proof";

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function failure(error: string): OrderActionResult {
  return { error };
}

async function hasValidImageSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (file.type === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }
  return (
    file.type === "image/webp" &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

function parseItems(value: string): RequestedItem[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 30)
      return null;
    const items: RequestedItem[] = [];
    const seen = new Set<string>();
    for (const item of parsed) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.id !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(item.id) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_CART_QUANTITY ||
        seen.has(item.id)
      )
        return null;
      seen.add(item.id);
      items.push({ id: item.id, quantity: item.quantity });
    }
    return items;
  } catch {
    return null;
  }
}

export async function createOrder(form: FormData): Promise<OrderActionResult> {
  const name = text(form, "name");
  const phone = text(form, "phone");
  const alternatePhone = text(form, "alternatePhone");
  const city = text(form, "city");
  const address = text(form, "address");
  const notes = text(form, "notes");
  const paymentMethod = text(form, "paymentMethod");
  const items = parseItems(text(form, "items"));
  const normalizedPhone = phone.replace(/[\s()-]/g, "");
  const normalizedAlternatePhone = alternatePhone.replace(/[\s()-]/g, "");

  if (
    name.length < 2 ||
    name.length > 120 ||
    !/^\+?[0-9]{8,15}$/.test(normalizedPhone) ||
    (alternatePhone && !/^\+?[0-9]{8,15}$/.test(normalizedAlternatePhone)) ||
    city.length < 2 ||
    city.length > 100 ||
    address.length < 8 ||
    address.length > 500 ||
    notes.length > 500 ||
    (paymentMethod !== "cash" && paymentMethod !== "instapay") ||
    !items
  )
    return failure("راجع البيانات المطلوبة وتأكد إنها مكتوبة بشكل صحيح.");

  let screenshot: File | null = null;
  if (paymentMethod === "instapay") {
    const file = form.get("screenshot");
    if (!(file instanceof File) || !file.size)
      return failure("ارفع صورة التحويل علشان نكمل الطلب.");
    if (
      !ALLOWED_SCREENSHOT_TYPES.includes(file.type) ||
      file.size > MAX_SCREENSHOT_SIZE
    ) {
      return failure(
        "صورة التحويل لازم تكون PNG أو JPG أو WEBP وبحجم أقل من 5 ميجابايت.",
      );
    }
    if (!(await hasValidImageSignature(file)))
      return failure("ملف صورة التحويل غير صالح.");
    screenshot = file;
  }

  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch (error) {
    console.error("Secure order submission is not configured.", error);
    return failure("الطلبات غير متاحة حاليًا. يرجى المحاولة لاحقًا.");
  }

  const { data: orders, error: orderError } = await supabase.rpc(
    "orders",
    {
      cus: name,
      p_phone: normalizedPhone,
      p_alternate_phone: normalizedAlternatePhone,
      p_city: city,
      p_address: address,
      p_notes: notes,
      p_payment_method: paymentMethod,
      p_items: items,
    },
  );
  const order = Array.isArray(orders) ? orders[0] : null;
  if (orderError || !order?.order_id) {
    const databaseMessage = orderError?.message ?? "";
    if (databaseMessage.includes("customer_blocked")) {
      return failure("مش قادرين نستقبل طلبات من رقم الموبايل ده.");
    }
    if (databaseMessage.includes("product_unavailable")) {
      return failure("في منتج أو أكتر مبقاش متاح. حدّث السلة وحاول تاني.");
    }
    if (databaseMessage.includes("payment_method_disabled")) {
      return failure("طريقة الدفع دي مش متاحة حاليًا.");
    }
    if (databaseMessage.includes("ordering_disabled")) {
      return failure("الطلبات متوقفة مؤقتًا. حاول مرة أخرى لاحقًا.");
    }
    if (databaseMessage.includes("delivery_location_unavailable")) {
      return failure("منطقة التوصيل غير متاحة حاليًا. اختار منطقة تانية.");
    }
    if (databaseMessage.includes("Could not find the function")) {
      console.error("Guest checkout database function is not deployed.", orderError);
      return failure(
        "إعدادات الطلب غير مكتملة على قاعدة البيانات. يرجى التواصل مع المتجر.",
      );
    }
    console.error("Unable to create guest order.", orderError);
    return failure("تعذر إنشاء الطلب. حاول تاني.");
  }

  const orderId = order.order_id as string;
  const total = Number(order.total);
  if (screenshot) {
    const extension =
      screenshot.type === "image/png"
        ? "png"
        : screenshot.type === "image/webp"
          ? "webp"
          : "jpg";
    const uploadedPath = `${orderId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from(PAYMENT_PROOF_BUCKET)
      .upload(uploadedPath, screenshot, {
        contentType: screenshot.type,
        upsert: false,
      });
    if (error) {
      console.error("Unable to upload payment proof.", error);
      return { orderId, total, proofWarning: true };
    }
    const { data: proofMarked, error: proofError } = await supabase.rpc(
      "mark_guest_payment_proof",
      { p_order_id: orderId },
    );
    if (proofError || proofMarked !== true) {
      console.error("Unable to mark payment proof as received.", proofError);
      const { error: removeError } = await supabase.storage
        .from(PAYMENT_PROOF_BUCKET)
        .remove([uploadedPath]);
      if (removeError) {
        console.error("Unable to remove incomplete payment proof.", removeError);
      }
      return { orderId, total, proofWarning: true };
    }
    if (isPaymentProofAccessConfigured()) {
      try {
        const cookieStore = await cookies();
        cookieStore.set(
          getPaymentProofCookieName(orderId),
          createPaymentProofAccessToken(orderId),
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: PAYMENT_PROOF_ACCESS_SECONDS,
            path: "/order-confirmation",
          },
        );
      } catch (error) {
        console.error("Unable to grant private payment proof access.", error);
      }
    }
  }

  return { orderId, total };
}
