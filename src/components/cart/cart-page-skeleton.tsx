function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`animate-pulse rounded-md bg-[#eee5df] ${className}`} />
  );
}

function CartItemSkeleton() {
  return (
    <article className="grid grid-cols-[65px_minmax(0,1fr)] items-center gap-2.5 rounded-[10px] border border-line bg-white p-3 sm:grid-cols-[86px_minmax(0,1fr)_auto] sm:gap-4">
      <Skeleton className="size-[65px] rounded-md sm:h-[76px] sm:w-[86px]" />
      <div className="min-w-0">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <Skeleton className="mt-2 h-3 w-1/3" />
      </div>
      <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto">
        <div className="flex h-[35px] items-center gap-2 rounded-md border border-line px-1.5">
          <Skeleton className="h-5 w-4" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-4" />
        </div>
        <Skeleton className="h-3 w-10" />
      </div>
    </article>
  );
}

export function CartPageSkeleton() {
  return (
    <main
      className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-7 sm:py-10"
      role="status"
      aria-label="جارٍ تحميل السلة"
    >
      <span className="sr-only">جارٍ تحميل السلة...</span>

      <div className="mb-4 rounded-lg border border-line bg-white p-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="mr-auto h-4 w-40 self-center" />
        </div>
      </div>
      <div className="mb-4 h-11 rounded-lg bg-brand-light" />

      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_.8fr]">
        <div className="grid gap-3" aria-hidden="true">
          <CartItemSkeleton />
          <CartItemSkeleton />
          <CartItemSkeleton />
          <Skeleton className="h-10 w-36 justify-self-start" />
        </div>

        <aside className="rounded-[10px] border border-line bg-white p-5" aria-hidden="true">
          <Skeleton className="mb-5 h-5 w-32" />
          <div className="my-3 flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="my-3 flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="my-3 flex justify-between border-t border-line pt-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="mt-2 h-11 w-full" />
        </aside>
      </div>
    </main>
  );
}
