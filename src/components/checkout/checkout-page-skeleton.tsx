function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`animate-pulse rounded-md bg-[#eee5df] ${className}`} />
  );
}

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-[43px] w-full" />
    </div>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <main
      className="mx-auto min-h-[58vh] w-[calc(100%-2rem)] max-w-5xl py-7 sm:py-10"
      role="status"
      aria-label="جارٍ تحميل إعدادات التوصيل والدفع"
    >
      <span className="sr-only">جارٍ تحميل إعدادات التوصيل والدفع...</span>

      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-80" />
      <Skeleton className="mb-5 mt-4 h-11 w-full rounded-lg bg-brand-light" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,.7fr)]">
        <div
          className="rounded-[10px] border border-line bg-white p-4 sm:p-5"
          aria-hidden="true"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="sm:col-span-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="mt-1.5 h-[86px] w-full" />
            </div>

            <div className="rounded-lg border border-line p-3 sm:col-span-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3.5 w-3/4" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-11 flex-1" />
                <Skeleton className="h-11 w-20" />
              </div>
              <Skeleton className="mt-3 h-9 w-40" />
              <div className="mt-3 flex gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-16" />
                ))}
              </div>
              <Skeleton className="mt-3 h-[300px] w-full rounded-lg sm:h-[360px]" />
              <Skeleton className="mt-3 h-16 w-full rounded-md bg-brand-light" />
            </div>

            <div className="sm:col-span-2">
              <Skeleton className="h-[86px] w-full" />
            </div>

            <div className="sm:col-span-2">
              <Skeleton className="h-3.5 w-20" />
              <div className="mt-2 grid gap-2">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </div>

          <Skeleton className="mt-4 h-11 w-full sm:w-40" />
        </div>

        <aside
          className="rounded-[10px] border border-line bg-white p-4 sm:p-5"
          aria-hidden="true"
        >
          <Skeleton className="mb-5 h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex justify-between gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
          <div className="my-3 flex justify-between border-t border-line pt-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="my-3 flex justify-between border-t border-line pt-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="my-3 flex justify-between border-t border-line pt-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="mt-2 h-11 w-full" />
        </aside>
      </div>
    </main>
  );
}
