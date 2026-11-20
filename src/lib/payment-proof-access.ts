import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const PAYMENT_PROOF_ACCESS_SECONDS = 15 * 60;

function getSigningSecret(): string {
  const secret = process.env.PAYMENT_PROOF_SIGNING_SECRET;
  if (!secret) throw new Error("PAYMENT_PROOF_SIGNING_SECRET is not configured.");
  return secret;
}

export function isPaymentProofAccessConfigured(): boolean {
  return Boolean(process.env.PAYMENT_PROOF_SIGNING_SECRET);
}

export function getPaymentProofCookieName(orderId: string): string {
  return `payment_proof_${orderId.replace(/-/g, "")}`;
}

export function createPaymentProofAccessToken(orderId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + PAYMENT_PROOF_ACCESS_SECONDS;
  return `${expiresAt}.${sign(orderId, expiresAt)}`;
}

export function isValidPaymentProofAccessToken(
  token: string,
  orderId: string,
): boolean {
  const [expiresAtValue, signature, ...rest] = token.split(".");
  if (
    rest.length > 0 ||
    !/^\d+$/.test(expiresAtValue ?? "") ||
    !signature ||
    Number(expiresAtValue) <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  const expected = Buffer.from(sign(orderId, Number(expiresAtValue)));
  const provided = Buffer.from(signature);
  return (
    expected.length === provided.length &&
    timingSafeEqual(expected, provided)
  );
}

function sign(orderId: string, expiresAt: number): string {
  const secret = getSigningSecret();
  return createHmac("sha256", secret)
    .update(`${orderId}:${expiresAt}`)
    .digest("base64url");
}
