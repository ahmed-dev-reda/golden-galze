"use client";

import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice, productName } from "@/lib/format";
import { MAX_CART_QUANTITY } from "@/lib/constants";

export function CartPage() {
  const { items, total, hydrated, setQuantity, removeItem } = useCart();

  if (!hydrated) return   <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10" aria-live="polite">لحظة بنجهز السلة...</main>;
  if (items.length === 0) {
    return (
      <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-10">
        <div className="mx-auto max-w-xl rounded-xl border border-[#eee7e1] bg-white px-5 py-10 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[#fff0f2] text-3xl text-[#cb607a]" aria-hidden="true">♡</div>
          <h1 className="my-2 text-2xl font-bold">السلة لسه فاضية</h1>
          <p className="mb-5 text-[#82736b]">اختار الدونات اللي بتحبها وضيفها للسلة.</p>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#cb607a] px-5 font-semibold text-white hover:bg-[#b94f69]" href="/">تسوق الدونات</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-7 sm:py-10">
      <h1 className="mb-6 text-[27px] font-bold">سلة المشتريات</h1>
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_.8fr]">
        <div className="grid gap-3">
          {items.map((item) => (
            <article className="grid grid-cols-[65px_minmax(0,1fr)] items-center gap-2.5 rounded-[10px] border border-[#eee7e1] bg-white p-3 sm:grid-cols-[86px_minmax(0,1fr)_auto] sm:gap-4" key={item.id}>
              <div className="size-[65px] overflow-hidden rounded-md bg-[#f9f4f0] sm:h-[76px] sm:w-[86px]">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-full w-full object-cover" src={item.imageUrl} alt={productName(item.name)} />
                )}
              </div>
              <div>
                <h2 className="mb-1 mt-0 text-[15px] font-semibold">{productName(item.name)}</h2>
                <p className="m-0 text-[13px] font-semibold text-[#cb607a]">{formatPrice(item.price)}</p>
              </div>
              <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto">
                <div className="flex h-[35px] items-center gap-2 rounded-md border border-[#eee7e1] px-1.5" aria-label="تعديل الكمية">
                  <button className="h-7 w-5 cursor-pointer border-0 bg-transparent text-xl text-[#6a4537]" type="button" aria-label="قلل الكمية" onClick={() => setQuantity(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button className="h-7 w-5 cursor-pointer border-0 bg-transparent text-xl text-[#6a4537] disabled:opacity-40" type="button" aria-label="زود الكمية" disabled={item.quantity >= MAX_CART_QUANTITY} onClick={() => setQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button className="cursor-pointer border-0 bg-transparent p-1 text-xs text-[#997e75] hover:text-red-700" type="button" onClick={() => removeItem(item.id)}>حذف</button>
              </div>
            </article>
          ))}
          <Link className="inline-flex min-h-10 items-center justify-center justify-self-start rounded-lg bg-[#f5efea] px-4 font-semibold text-[#6a4537]" href="/">كمّل تسوق</Link>
        </div>
        <aside className="rounded-[10px] border border-[#eee7e1] bg-white p-5">
          <h2 className="mb-4 mt-0 text-[17px] font-semibold">ملخص الطلب</h2>
          <div className="my-3 flex justify-between gap-3 text-sm text-[#6f5f57]"><span>المجموع</span><span>{formatPrice(total)}</span></div>
          <div className="my-3 flex justify-between gap-3 text-sm text-[#6f5f57]"><span>التوصيل</span><span>بيتحدد حسب العنوان</span></div>
          <div className="my-3 flex justify-between gap-3 border-t border-[#eee7e1] pt-3 text-base font-bold"><span>الإجمالي المبدئي</span><span>{formatPrice(total)}</span></div>
          <Link className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#cb607a] px-5 font-semibold text-white hover:bg-[#b94f69]" href="/checkout">كمّل الطلب</Link>
        </aside>
      </div>
    </main>
  );
}
