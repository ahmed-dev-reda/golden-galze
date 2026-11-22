import { ProductCardSkeleton } from "./product-card-skeleton";

export function ProductGridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4"
      role="status"
      aria-label="بنجهز منتجاتنا..."
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
      <span className="sr-only">بنجهز منتجاتنا...</span>
    </div>
  );
}
