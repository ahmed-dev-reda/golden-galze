import type { Metadata } from "next";
import { Suspense } from "react";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import AppHeader from "@/components/layout/app-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartHydration } from "@/components/cart/cart-hydration";

const ibm = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "جولدن جليز دونات | دونات طازة معمول بحب",
  description: "اختار الدونات المفضلة عندك واستمتع بأحلى طعم في كل قطعة.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${ibm.className} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-page text-ink antialiased">
        <CartHydration />
        <AppHeader />
        <div className="flex-1">{children}</div>
        <Suspense fallback={null}>
          <SiteFooter />
        </Suspense>
      </body>
    </html>
  );
}