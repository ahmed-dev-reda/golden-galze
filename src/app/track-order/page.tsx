import { TrackOrderForm } from "@/components/orders/track-order-form";

export default function TrackOrderPage() {
  return (
    <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
      <section className="mx-auto max-w-xl rounded-xl border border-line bg-white px-5 py-8">
        <h1 className="mb-2 mt-0 text-2xl font-bold">تتبع طلبك</h1>
        <p className="mb-6 text-sm leading-7 text-muted">
          أدخل رقم الطلب ورقم الهاتف الذي استخدمته عند الطلب لعرض آخر تحديث.
        </p>
        <TrackOrderForm />
      </section>
    </main>
  );
}
