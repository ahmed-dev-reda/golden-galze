import { getPublicStoreSettings } from "@/lib/public-store-settings";
import { getWhatsAppLink } from "@/lib/store-config";
import Link from "next/link";
import { connection } from "next/server";

export async function SiteFooter() {
  await connection();
  const settings = await getPublicStoreSettings();
  const links = [
    { label: "واتساب", href: getWhatsAppLink(settings.whatsapp) },
    { label: "إنستجرام", href: settings.instagram },
    { label: "فيسبوك", href: settings.facebook },
  ].filter((item): item is { label: string; href: string } =>
    Boolean(item.href),
  );
  return (
    <footer className="border-t border-[#eee7e1] bg-white">
      <div className="mx-auto grid w-[calc(100%-2rem)] max-w-6xl grid-cols-2 gap-x-4 gap-y-6 py-7 sm:grid-cols-[2fr_1fr_1fr] sm:gap-9">
        <div className="col-span-2 sm:col-span-1">
          <Link
            className="inline-flex items-center gap-2.5 whitespace-nowrap text-[15px] font-bold sm:text-[17px]"
            href="/"
          >
            <span
              className="grid size-[35px] place-items-center rounded-full bg-[#e9859b] text-xl text-white"
              aria-hidden="true"
            >
              ج
            </span>
            <span>
              جولدن جليز <b className="text-[#cb607a]">دونات</b>
            </span>
          </Link>
          <p className="mb-0 mt-3 max-w-sm text-[13px] leading-7 text-[#82736b]">
            أهلاً بيك في عالم الدونات! اختار الدونات المفضلة عندك واستمتع بأحلى
            طعم.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-[13px] text-[#82736b]">
          <h2 className="mb-1 mt-0 text-sm font-semibold text-[#34251f]">
            روابط سريعة
          </h2>
          <Link className="hover:text-[#cb607a]" href="/">
            الرئيسية
          </Link>
          <Link className="hover:text-[#cb607a]" href="/filled-donuts">
            الدونات المحشية
          </Link>
          <Link className="hover:text-[#cb607a]" href="/mini-donuts">
            الميني دونات
          </Link>
        </div>
        <div className="flex flex-col items-start gap-2 text-[13px] text-[#82736b]">
          <h2 className="mb-1 mt-0 text-sm font-semibold text-[#34251f]">
            تواصل معانا
          </h2>
          {settings.phone && (
            <a className="hover:text-[#cb607a]" href={`tel:${settings.phone}`}>
              {settings.phone}
            </a>
          )}
          {settings.alternatePhone && (
            <a
              className="hover:text-[#cb607a]"
              href={`tel:${settings.alternatePhone}`}
            >
              {settings.alternatePhone}
            </a>
          )}
          {links.map((link) => (
            <a
              className="hover:text-[#cb607a]"
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
          {links.length === 0 &&
            !settings.phone &&
            !settings.alternatePhone && (
              <span>بيانات التواصل هتتوفر قريب.</span>
            )}
        </div>
      </div>
      <div className="flex min-h-12 flex-col justify-center gap-2 border-t border-[#eee7e1] px-4 py-3 text-[11px] text-[#82736b] sm:flex-row sm:items-center sm:justify-between sm:px-[max(1rem,calc((100%-72rem)/2))]">
        <span>© جولدن جليز دونات. جميع الحقوق محفوظة.</span>
        <span>معمول بحب، مخصوص ليك.</span>
      </div>
    </footer>
  );
}
