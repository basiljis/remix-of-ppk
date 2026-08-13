import { Skeleton } from "@/components/ui/skeleton";

export const HomeSkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-16 border-b flex items-center justify-between px-4 md:px-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <main className="flex-1">
        <section className="pt-28 pb-16 px-4">
          <div className="container mx-auto max-w-5xl text-center flex flex-col items-center">
            <Skeleton className="h-6 w-48 rounded-full mb-6" />
            <Skeleton className="h-12 w-3/4 mb-6" />
            <Skeleton className="h-16 w-2/3 mb-10" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-8 border rounded-xl space-y-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
