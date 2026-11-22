"use client";

import { motion } from "motion/react";

function SkeletonItem({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-[#eee5df] ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-w-0 overflow-hidden rounded-[11px] bg-white shadow"
      aria-hidden="true"
    >
      {/* Image */}
      <SkeletonItem className="aspect-[1.15] w-full rounded-none" />

      <div className="p-2.5 sm:p-3.5">
        {/* Product name and price */}
        <div className="flex items-start justify-between gap-3">
          <SkeletonItem className="h-4 w-2/3" />
          <SkeletonItem className="h-4 w-1/4" />
        </div>

        {/* Quantity and cart */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex h-[35px] items-center gap-3 rounded-md border border-line px-1.5">
            <SkeletonItem className="h-4 w-3" />
            <SkeletonItem className="h-4 w-3" />
            <SkeletonItem className="h-4 w-3" />
          </div>

          <SkeletonItem className="size-7 rounded-md" />
        </div>
      </div>
    </motion.article>
  );
}
