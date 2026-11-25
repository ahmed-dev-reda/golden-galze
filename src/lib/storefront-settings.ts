export type StorefrontSettings = {
  orderingEnabled: boolean;
  closedMessage: string;
  deliveryAreas: string[];
  deliveryFee: number;
  deliveryFees: Record<string, number>;
  cashOnDeliveryEnabled: boolean;
  instapayEnabled: boolean;
  instapayAccount: string;
  whatsapp: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function parseStorefrontSettings(
  value: unknown,
): StorefrontSettings | null {
  if (!isRecord(value)) return null;

  const {
    orderingEnabled,
    closedMessage,
    deliveryAreas,
    deliveryFee,
    deliveryFees,
    cashOnDeliveryEnabled,
    instapayEnabled,
    instapayAccount,
    whatsapp,
  } = value;

  if (
    typeof orderingEnabled !== "boolean" ||
    typeof closedMessage !== "string" ||
    !Array.isArray(deliveryAreas) ||
    !deliveryAreas.every((area) => typeof area === "string") ||
    !isAmount(deliveryFee) ||
    !isRecord(deliveryFees) ||
    typeof cashOnDeliveryEnabled !== "boolean" ||
    typeof instapayEnabled !== "boolean" ||
    typeof instapayAccount !== "string" ||
    (whatsapp !== undefined && typeof whatsapp !== "string")
  ) {
    return null;
  }

  const parsedDeliveryFees: Record<string, number> = {};
  for (const [area, fee] of Object.entries(deliveryFees)) {
    if (!isAmount(fee)) return null;
    parsedDeliveryFees[area] = fee;
  }

  return {
    orderingEnabled,
    closedMessage,
    deliveryAreas,
    deliveryFee,
    deliveryFees: parsedDeliveryFees,
    cashOnDeliveryEnabled,
    instapayEnabled,
    instapayAccount,
    whatsapp: typeof whatsapp === "string" ? whatsapp : "",
  };
}
