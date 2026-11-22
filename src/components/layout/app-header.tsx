"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { selectCartItemCount, useCartStore } from "@/store/cart-store";
import logo from "@/app/logo.png";
import Image from "next/image";
import { Menu, ShoppingCart, X } from "lucide-react";

export default function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const cartItemCount = useCartStore(selectCartItemCount);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    { href: "/filled-donuts", label: "الدونات المحشية" },
    { href: "/mini-donuts", label: "الميني دونات" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-page/95 backdrop-blur-md">
      <div className="relative mx-auto flex min-h-16 w-[calc(100%-2rem)] max-w-6xl items-center justify-between gap-4 sm:min-h-[76px]">
        {/* Logo */}
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

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-8 text-sm text-[#62524b] sm:flex"
          aria-label="القائمة الرئيسية"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center">
          {/* Cart */}
          <Link
            className="relative inline-flex size-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-brand/10 hover:text-brand"
            href="/cart"
            aria-label="سلة التسوق"
          >
            <ShoppingCart size={21} />

            <AnimatePresence>
              {hasHydrated && cartItemCount > 0 && (
                <motion.span
                  key="cart-count"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -right-1 -top-1 grid min-h-[20px] min-w-[20px] place-items-center rounded-full bg-brand-light px-1 text-[11px] font-bold text-brand"
                >
                  {cartItemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Mobile Menu Button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            className="flex size-10 items-center justify-center rounded-lg bg-transparent text-warm transition-colors hover:bg-brand/10 sm:hidden"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={menuOpen ? "close" : "menu"}
                initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                {menuOpen ? <X size={23} /> : <Menu size={23} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-line bg-page sm:hidden"
            aria-label="القائمة الرئيسية"
          >
            <div className="mx-auto flex w-[calc(100%-2rem)] max-w-6xl flex-col py-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-line/70 py-3 text-sm text-[#62524b] transition-colors last:border-0 hover:text-brand"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
