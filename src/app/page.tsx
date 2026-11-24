import { OrderModeSelector } from "@/components/welcome/buttons";
import { cairoBusinessDate } from "@/lib/order-mode";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-skeleton-grid";
import { Suspense } from "react";
import { connection } from "next/server";
import { getPreorderDateOptions } from "@/lib/preorder-dates";

export default function HomePage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await connection();
  return (
    <main>
      <section className="relative mx-auto mt-4 min-h-[220px] w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-xl bg-brand-light px-6 py-7 sm:mt-[30px] sm:min-h-[245px] sm:px-12 sm:py-10">
        <p className="m-0 text-[13px] font-semibold text-brand">
          دونات طازة معمول بحب
        </p>
        <h1 className="my-2 text-[25px] font-bold leading-relaxed sm:text-[38px]">
          أهلاً بيك في عالم الدونات!
        </h1>
        <p className="mb-5 mt-0 max-w-[490px] text-sm text-[#725e56] sm:text-base">
          اختار الدونات المفضلة عندك واستمتع بأحلى طعم في كل قطعة.
        </p>
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-hover"
          href="#donuts"
        >
          شوف الدونات <span aria-hidden="true">←</span>
        </a>
        <span
          className="absolute left-[8%] top-6 text-[27px] text-[#e9b5b4] sm:left-[16%] sm:top-11 sm:text-[37px]"
          aria-hidden="true"
        >
          ✳
        </span>
        <span
          className="absolute bottom-5 left-[20%] text-2xl text-[#e9b5b4] sm:bottom-10 sm:left-[28%]"
          aria-hidden="true"
        >
          ✦
        </span>
      </section>
      <section className="mx-auto w-[calc(100%-2rem)] max-w-6xl pt-4 sm:pt-6">
        <OrderModeSelector
          todayDate={cairoBusinessDate()}
          preorderDates={getPreorderDateOptions()}
        />
      </section>
      <section
        className="mx-auto w-[calc(100%-2rem)] max-w-6xl pb-12 pt-7 sm:pb-[75px] sm:pt-[37px]"
        id="donuts"
      >
        <div className="mb-4 flex flex-col items-start gap-1 sm:mb-[22px] sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <div>
            <p className="m-0 text-[13px] font-semibold text-brand">
              اختار اللي بتحبه
            </p>
            <h2 className="mb-0 mt-1 text-[23px] font-bold sm:text-[26px]">
              الدونات بتاعتنا
            </h2>
          </div>
          <p className="m-0 text-sm text-muted">كل قطعة بتتعمل طازة علشانك.</p>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid />
        </Suspense>
      </section>
    </main>
  );
}
