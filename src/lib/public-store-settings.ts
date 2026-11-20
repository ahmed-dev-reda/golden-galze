import "server-only";

import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase";

export type PublicStoreSettings = {
  phone: string;
  whatsapp: string;
  alternatePhone: string;
  instagram: string;
  facebook: string;
  deliveryFee: number;
  deliveryAreas: string[];
  deliveryFees: Record<string, number>;
  cashOnDeliveryEnabled: boolean;
  instapayEnabled: boolean;
  instapayAccount: string;
  orderingEnabled: boolean;
  closedMessage: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const getPublicStoreSettings = cache(
  async (): Promise<PublicStoreSettings> => {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("get_storefront_settings");
    if (error) {
      throw new Error(`Unable to load public store settings: ${error.message}`);
    }
    if (!isRecord(data)) {
      throw new Error("Public store settings have an invalid shape.");
    }

    const areas = data.deliveryAreas;
    const deliveryFee = Number(data.deliveryFee);
    const rawDeliveryFees = data.deliveryFees;
    if (
      !Array.isArray(areas) ||
      !areas.every((area) => typeof area === "string") ||
      !isRecord(rawDeliveryFees) ||
      !Number.isFinite(deliveryFee) ||
      typeof data.cashOnDeliveryEnabled !== "boolean" ||
      typeof data.instapayEnabled !== "boolean" ||
      typeof data.orderingEnabled !== "boolean"
    ) {
      throw new Error("Public store settings contain invalid values.");
    }

    const deliveryFees: Record<string, number> = {};
    for (const [area, fee] of Object.entries(rawDeliveryFees)) {
      const numericFee = Number(fee);
      if (!Number.isFinite(numericFee) || numericFee < 0) {
        throw new Error("Public delivery fees contain invalid values.");
      }
      deliveryFees[area] = numericFee;
    }

    return {
      phone: typeof data.phone === "string" ? data.phone : "",
      whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : "",
      alternatePhone:
        typeof data.alternatePhone === "string" ? data.alternatePhone : "",
      instagram: typeof data.instagram === "string" ? data.instagram : "",
      facebook: typeof data.facebook === "string" ? data.facebook : "",
      deliveryFee,
      deliveryAreas: areas,
      deliveryFees,
      cashOnDeliveryEnabled: data.cashOnDeliveryEnabled,
      instapayEnabled: data.instapayEnabled,
      instapayAccount:
        typeof data.instapayAccount === "string" ? data.instapayAccount : "",
      orderingEnabled: data.orderingEnabled,
      closedMessage:
        typeof data.closedMessage === "string" ? data.closedMessage : "",
    };
  },
);
