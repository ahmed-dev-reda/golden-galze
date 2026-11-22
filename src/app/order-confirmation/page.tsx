import { Suspense } from "react";
import { OrderConfirmation } from "@/components/orders/order-confirmation";

type OrderConfirmationPageProps = {
  searchParams: Promise<{
    orderId?: string;
    receipt?: string;
  }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ConfirmationLoading() {
  return (
    <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
      <p className="mx-auto max-w-xl rounded-lg border border-line bg-white p-5 text-sm" role="status">
        جارٍ تحميل تأكيد الطلب...
      </p>
    </main>
  );
}

export default function OrderConfirmationPage({
  searchParams,
}: OrderConfirmationPageProps) {
  return (
    <Suspense fallback={<ConfirmationLoading />}>
      <ConfirmationContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ConfirmationContent({
  searchParams,
}: OrderConfirmationPageProps) {
  const params = await searchParams;
  const orderId =
    params.orderId && uuidPattern.test(params.orderId) ? params.orderId : "";

  return (
    <OrderConfirmation orderId={orderId} receiptStatus={params.receipt ?? ""} />
  );
}
