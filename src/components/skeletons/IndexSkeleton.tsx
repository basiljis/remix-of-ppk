import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider } from "@/components/ui/sidebar";

export const IndexSkeleton = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar placeholder */}
        <div className="hidden md:block w-64 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-3/4 mb-8" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </header>

          {/* Content */}
          <main className="p-4 md:p-6 space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 border rounded-xl space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>

            <div className="border rounded-xl p-6 space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
