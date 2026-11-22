"use client";

import Link from "next/link";
import { useState } from "react";
import { selectCartItemCount, useCartStore } from "@/store/cart-store";
import logo from "@/app/logo.png";
import Image from "next/image";

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartItemCount = useCartStore(selectCartItemCount);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-page/95">
      <div className="mx-auto flex min-h-16 w-[calc(100%-2rem)] max-w-6xl items-center justify-between gap-6 sm:min-h-[76px]">
        <Link
          className="inline-flex items-center gap-2.5 whitespace-nowrap text-[15px] font-bold sm:text-[17px]"
          href="/"
          aria-label="جولدن جليز دونات - الرئيسية"
        >
          <Image src={logo} alt="G" width={40} height={40} />
          <span>
            جولدن جليز <b className="text-brand">دونات</b>
          </span>
        </Link>
        <button
          className="flex size-10 cursor-pointer flex-col items-center justify-center gap-[5px] border-0 bg-transparent text-warm sm:hidden"
          type="button"
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="h-0.5 w-5 bg-current" />
          <span className="h-0.5 w-5 bg-current" />
        </button>
        <nav
          className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-0 border-b border-line bg-page px-4 pb-3 text-sm text-[#62524b] sm:static sm:flex sm:flex-row sm:items-center sm:gap-8 sm:border-0 sm:bg-transparent sm:p-0`}
          aria-label="القائمة الرئيسية"
        >
          <Link
            className="py-3 hover:text-brand sm:py-0"
            href="/"
            onClick={() => setMenuOpen(false)}
          >
            الرئيسية
          </Link>
          <Link
            className="py-3 hover:text-brand sm:py-0"
            href="/filled-donuts"
            onClick={() => setMenuOpen(false)}
          >
            الدونات المحشية
          </Link>
          <Link
            className="py-3 hover:text-brand sm:py-0"
            href="/mini-donuts"
            onClick={() => setMenuOpen(false)}
          >
            الميني دونات
          </Link>
          <Link
            className="inline-flex items-center gap-2 py-3 text-ink sm:py-0"
            href="/cart"
            onClick={() => setMenuOpen(false)}
          >
            <svg
              className="size-[21px] fill-none stroke-current stroke-[1.6]"
              aria-hidden="true"
              viewBox="0 0 24 24"
            >
              <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            <span>السلة</span>
            {hasHydrated && cartItemCount > 0 && (
              <span
                className="grid min-h-[22px] min-w-[22px] place-items-center rounded-full bg-brand-light px-1 text-xs font-bold text-brand"
                aria-label={`${cartItemCount} منتجات`}
              >
                {cartItemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
