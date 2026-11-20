import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { shortOrderId } from "@/lib/order-id";
import { PaymentProofViewer } from "@/components/checkout/payment-proof-viewer";
import {
  getPaymentProofCookieName,
  isPaymentProofAccessConfigured,
  isValidPaymentProofAccessToken,
} from "@/lib/payment-proof-access";

type Props = { searchParams: Promise<{ id?: string; proof?: string }> };

async function OrderConfirmationContent({ searchParams }: Props) {
  const { id, proof } = await searchParams;
  const orderId = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  const cookieStore = await cookies();
  const accessToken = orderId
    ? cookieStore.get(getPaymentProofCookieName(orderId))?.value
    : undefined;
  const canViewPaymentProof = Boolean(
    orderId &&
    isPaymentProofAccessConfigured() &&
      accessToken &&
      isValidPaymentProofAccessToken(accessToken, orderId),
  );
  return (
    <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
      <div className="mx-auto my-5 max-w-xl rounded-xl border border-[#eee7e1] bg-white px-5 py-9 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[#fff0f2] text-3xl text-[#cb607a]" aria-hidden="true">✓</div>
        <h1 className="mb-2 mt-0 text-2xl font-bold">{orderId ? "طلبك وصل بنجاح!" : "شكرًا لزيارتك!"}</h1>
        <p className="text-[#82736b]">{orderId ? "هنبدأ نجهز طلبك، وفريقنا هيتواصل معاك لتأكيد تفاصيل التوصيل." : "لو كنت أكدت طلبك، هتلاقي رقم الطلب في صفحة التأكيد."}</p>
        {orderId && <div className="my-4 rounded-md bg-[#faf6f2] p-3 text-sm">رقم الطلب: <bdi>{shortOrderId(orderId)}</bdi></div>}
        {orderId && proof === "missing" && (
          <p className="my-4 rounded-md bg-[#fff6e8] p-3 text-sm text-[#72511f]" role="status">
            تم تسجيل طلبك، لكن لم نتمكن من حفظ صورة التحويل. من فضلك تواصل مع المتجر لتأكيد الدفع.
          </p>
        )}
        {canViewPaymentProof && orderId && (
          <PaymentProofViewer orderId={orderId} />
        )}
        <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#cb607a] px-5 font-semibold text-white hover:bg-[#b94f69]" href="/">ارجع للرئيسية</Link>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage(props: Props) {
  return (
    <Suspense fallback={<main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">بنجهز تأكيد الطلب...</main>}>
      <OrderConfirmationContent {...props} />
    </Suspense>
  );
}
