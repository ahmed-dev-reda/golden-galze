import Link from "next/link";
import logo from "@/app/logo.png";
import Image from "next/image";
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid w-[calc(100%-2rem)] max-w-6xl grid-cols-2 gap-x-4 gap-y-6 py-7 sm:grid-cols-[2fr_1fr_1fr] sm:gap-9">
        <div className="col-span-2 sm:col-span-1">
          <Link
            className="inline-flex items-center gap-2.5 whitespace-nowrap text-[15px] font-bold sm:text-[17px]"
            href="/"
          >
            <Image src={logo} alt="G" width={40} height={40} />
            <span>
              جولدن جليز <b className="text-brand">دونات</b>
            </span>
          </Link>
          <p className="mb-0 mt-3 max-w-sm text-[13px] leading-7 text-muted">
            أهلاً بيك في عالم الدونات! اختار الدونات المفضلة عندك واستمتع بأحلى
            طعم.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-[13px] text-muted">
          <h2 className="mb-1 mt-0 text-sm font-semibold text-ink">
            روابط سريعة
          </h2>
          <Link className="hover:text-brand" href="/">
            الرئيسية
          </Link>
          <Link className="hover:text-brand" href="/filled-donuts">
            الدونات المحشية
          </Link>
          <Link className="hover:text-brand" href="/mini-donuts">
            الميني دونات
          </Link>
        </div>
        <div className="flex flex-col items-start gap-2 text-[13px] text-muted">
          <h2 className="mb-1 mt-0 text-sm font-semibold text-ink">
            تواصل معانا
          </h2>
          <span>بيانات التواصل هتتوفر قريب.</span>
        </div>
      </div>
      <div className="flex min-h-12 flex-col justify-center gap-2 border-t border-line px-4 py-3 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-[max(1rem,calc((100%-72rem)/2))]">
        <span>© جولدن جليز دونات. جميع الحقوق محفوظة.</span>
        <span>معمول بحب، مخصوص ليك.</span>
      </div>
    </footer>
  );
}
