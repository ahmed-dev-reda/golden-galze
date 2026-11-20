"use client";

import { useEffect, useState } from "react";
import { getCustomerPaymentProof } from "@/app/actions/payment-proof";

export function PaymentProofViewer({ orderId }: { orderId: string }) {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCustomerPaymentProof(orderId).then((proof) => {
      if (active) setImage(proof);
    });
    return () => {
      active = false;
    };
  }, [orderId]);

  if (!image) return null;

  return (
    <div className="my-5 rounded-lg border border-[#eee7e1] p-3 text-right">
      <p className="mb-3 text-sm font-semibold">صورة التحويل</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="max-h-80 w-full rounded-md object-contain"
        src={image}
        alt="صورة إثبات تحويل InstaPay"
      />
      <p className="mb-0 mt-2 text-xs text-[#82736b]">
        الصورة متاحة من هذا المتصفح لمدة 15 دقيقة.
      </p>
    </div>
  );
}
