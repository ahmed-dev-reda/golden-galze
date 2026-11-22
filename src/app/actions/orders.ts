"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/utils/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const phonePattern = /^[+]?[0-9]{8,15}$/;
const maxUploadSize = 5 * 1024 * 1024;
const uploadTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      subtotal: number;
      deliveryFee: number;
      total: number;
      paymentMethod: "cash" | "instapay";
      proofUploaded: boolean;
    }
  | {
      ok: false;
      message: string;
    }
  | {
      ok: false;
      orderCreated: true;
      orderId: string;
      subtotal: number;
      deliveryFee: number;
      total: number;
      paymentMethod: "instapay";
      message: string;
    };

export type TrackedOrder = {
  orderId: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentProof: boolean;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export type TrackOrderResult =
  | { ok: true; order: TrackedOrder }
  | { ok: false; message: string };

type OrderItemInput = { id: string; quantity: number };

function field(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : null;
}

function normalizePhone(value: string): string {
  return value
    .replace(/[٠-٩۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - (digit >= "۰" ? 1776 : 1632)),
    )
    .replace(/[\s()-]/g, "");
}

function parseItems(value: string | null): OrderItemInput[] | null {
  if (!value) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 30) {
    return null;
  }

  const items: OrderItemInput[] = [];
  const ids = new Set<string>();

  for (const entry of parsed as unknown[]) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      !uuidPattern.test(entry.id) ||
      typeof entry.quantity !== "number" ||
      !Number.isInteger(entry.quantity) ||
      entry.quantity < 1 ||
      entry.quantity > 50 ||
      ids.has(entry.id)
    ) {
      return null;
    }

    ids.add(entry.id);
    items.push({ id: entry.id, quantity: entry.quantity });
  }

  return items;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rpcRow(value: unknown): Record<string, unknown> | null {
  const row = Array.isArray(value) ? value[0] : value;
  return isRecord(row) ? row : null;
}

function amount(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function mapCreateError(message: string): string {
  if (message.includes("customer_blocked")) {
    return "لا يمكن استلام الطلب لهذا الرقم لانه محظور. تواصل مع المتجر للمساعدة.";
  }
  if (message.includes("product_unavailable")) {
    return "أحد المنتجات في سلتك لم يعد متاحًا. حدّث السلة وحاول مرة أخرى.";
  }
  if (message.includes("ordering_disabled")) {
    return "المتجر لا يستقبل الطلبات حاليًا.";
  }
  if (message.includes("delivery_location_unavailable")) {
    return "منطقة التوصيل المختارة غير متاحة حاليًا.";
  }
  if (message.includes("payment_method_disabled")) {
    return "طريقة الدفع المختارة غير متاحة حاليًا.";
  }
  if (message.includes("invalid_customer_details")) {
    return "راجع بيانات الاسم ورقم الهاتف والعنوان وحاول مرة أخرى.";
  }
  if (
    message.includes("invalid_order_items") ||
    message.includes("duplicate_order_items")
  ) {
    return "محتويات السلة غير صالحة. حدّث السلة وحاول مرة أخرى.";
  }
  if (
    message.includes("store_settings_missing") ||
    message.includes("invalid_delivery_fee_configuration")
  ) {
    return "تعذر التحقق من إعدادات التوصيل. حاول مرة أخرى لاحقًا.";
  }
  return "تعذر تسجيل الطلب. حاول مرة أخرى.";
}

function parseTrackedOrder(value: unknown): TrackedOrder | null {
  const row = rpcRow(value);
  if (!row) return null;

  const {
    order_id,
    status,
    total,
    payment_method,
    payment_proof,
    created_at,
    items,
  } = row;
  const parsedTotal = amount(total);
  if (
    typeof order_id !== "string" ||
    !uuidPattern.test(order_id) ||
    typeof status !== "string" ||
    parsedTotal === null ||
    typeof payment_method !== "string" ||
    typeof payment_proof !== "boolean" ||
    typeof created_at !== "string" ||
    !Array.isArray(items)
  ) {
    return null;
  }

  const parsedItems: TrackedOrder["items"] = [];
  for (const item of items) {
    if (!isRecord(item)) return null;
    const unitPrice = amount(item.unitPrice);
    if (
      typeof item.name !== "string" ||
      unitPrice === null ||
      typeof item.quantity !== "number" ||
      !Number.isFinite(item.quantity) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return null;
    }
    parsedItems.push({
      name: item.name,
      quantity: item.quantity,
      unitPrice,
    });
  }

  return {
    orderId: order_id,
    status,
    total: parsedTotal,
    paymentMethod: payment_method,
    paymentProof: payment_proof,
    createdAt: created_at,
    items: parsedItems,
  };
}

export async function createOrder(
  formData: FormData,
): Promise<CreateOrderResult> {
  const name = field(formData, "name");
  const phone = field(formData, "phone");
  const alternatePhone = field(formData, "alternatePhone") ?? "";
  const city = field(formData, "city");
  const address = field(formData, "address");
  const notes = field(formData, "notes") ?? "";
  const paymentMethod = field(formData, "paymentMethod");
  const items = parseItems(field(formData, "items"));
  const normalizedPhone = phone ? normalizePhone(phone) : "";
  const normalizedAlternatePhone = normalizePhone(alternatePhone);

  if (
    !name ||
    name.length < 2 ||
    name.length > 120 ||
    !phonePattern.test(normalizedPhone) ||
    (normalizedAlternatePhone !== "" &&
      !phonePattern.test(normalizedAlternatePhone)) ||
    !city ||
    city.length > 100 ||
    !address ||
    address.length < 8 ||
    address.length > 500 ||
    notes.length > 500 ||
    !items ||
    (paymentMethod !== "cash" && paymentMethod !== "instapay")
  ) {
    return {
      ok: false,
      message: "راجع البيانات المدخلة ومحتويات السلة وحاول مرة أخرى.",
    };
  }

  let screenshot: File | null = null;
  let extension: string | null = null;
  if (paymentMethod === "instapay") {
    const file = formData.get("screenshot");
    const fileExtension =
      file &&
      typeof file !== "string" &&
      Object.prototype.hasOwnProperty.call(uploadTypes, file.type)
        ? uploadTypes[file.type as keyof typeof uploadTypes]
        : null;
    if (
      !file ||
      typeof file === "string" ||
      file.size < 1 ||
      file.size > maxUploadSize ||
      !fileExtension
    ) {
      return {
        ok: false,
        message:
          "ارفع صورة تحويل JPG أو PNG أو WEBP بحجم لا يتجاوز 5 ميجابايت.",
      };
    }
    screenshot = file;
    extension = fileExtension;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_guest_order", {
    p_name: name,
    p_phone: phone,
    p_alternate_phone: alternatePhone,
    p_city: city,
    p_address: address,
    p_notes: notes,
    p_payment_method: paymentMethod,
    p_items: items,
  });

  if (error) {
    console.error("Guest order creation failed.", {
      code: error.code,
      message: error.message,
    });
    return { ok: false, message: mapCreateError(error.message) };
  }

  const row = rpcRow(data);
  const orderId = row?.order_id;
  const subtotal = amount(row?.subtotal);
  const deliveryFee = amount(row?.delivery_fee);
  const total = amount(row?.total);
  if (
    typeof orderId !== "string" ||
    !uuidPattern.test(orderId) ||
    subtotal === null ||
    deliveryFee === null ||
    total === null
  ) {
    console.error("Guest order RPC returned an invalid response.");
    return {
      ok: false,
      message: "تم إرسال الطلب لكن تعذر قراءة بيانات التأكيد.",
    };
  }

  if (paymentMethod === "cash") {
    return {
      ok: true,
      orderId,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      proofUploaded: false,
    };
  }

  const partialResult: CreateOrderResult = {
    ok: false,
    orderCreated: true,
    orderId,
    subtotal,
    deliveryFee,
    total,
    paymentMethod,
    message:
      "تم تسجيل طلبك، لكن تعذر اعتماد صورة التحويل. احتفظ برقم الطلب وتواصل مع المتجر لإكمال الدفع.",
  };
  if (!screenshot || !extension) return partialResult;

  const objectPath = `${orderId}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("payment_proof")
    .upload(objectPath, screenshot, {
      contentType: screenshot.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("InstaPay receipt upload failed.", {
      code: uploadError.name,
      message: uploadError.message,
    });
    return partialResult;
  }

  const { data: proofMarked, error: markError } = await supabase.rpc(
    "mark_guest_payment_proof",
    { p_order_id: orderId },
  );
  if (markError || proofMarked !== true) {
    console.error("InstaPay receipt could not be linked to the order.", {
      code: markError?.code,
      message: markError?.message,
    });
    return partialResult;
  }

  return {
    ok: true,
    orderId,
    subtotal,
    deliveryFee,
    total,
    paymentMethod,
    proofUploaded: true,
  };
}

export async function trackGuestOrder(
  formData: FormData,
): Promise<TrackOrderResult> {
  const orderId = field(formData, "orderId");
  const phone = field(formData, "phone");
  const normalizedPhone = phone ? normalizePhone(phone) : "";

  if (
    !orderId ||
    !uuidPattern.test(orderId) ||
    !phonePattern.test(normalizedPhone)
  ) {
    return {
      ok: false,
      message: "أدخل رقم الطلب ورقم الهاتف المسجل عليه الطلب بشكل صحيح.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("track_guest_order", {
    p_order_id: orderId,
    p_phone: normalizedPhone,
  });

  if (error) {
    console.error("Guest order tracking failed.", {
      code: error.code,
      message: error.message,
    });
    return { ok: false, message: "تعذر جلب حالة الطلب الآن. حاول مرة أخرى." };
  }

  const order = parseTrackedOrder(data);
  if (!order) {
    return {
      ok: false,
      message: "لم نعثر على طلب مطابق. راجع رقم الطلب ورقم الهاتف.",
    };
  }

  return { ok: true, order };
}
