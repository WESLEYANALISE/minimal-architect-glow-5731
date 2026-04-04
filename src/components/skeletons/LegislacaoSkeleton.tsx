import { Skeleton } from "@/components/ui/skeleton";

export const LegislacaoSkeleton = () => {
  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-200">
      <div className="border-b border-border/40 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto max-w-4xl px-4 py-6 text-center">
          <Skeleton className="mx-auto mb-4 h-20 w-20 rounded-[28px]" />
          <Skeleton className="mx-auto mb-2 h-8 w-52" />
          <Skeleton className="mx-auto mb-4 h-4 w-32" />
          <Skeleton className="mx-auto h-px w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-12 w-24 rounded-2xl" />
        </div>

        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>

        <div className="space-y-3 pb-20">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border/40 bg-card/40 p-4">
              <Skeleton className="mb-2 h-6 w-20" />
              <Skeleton className="mb-1 h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegislacaoSkeleton;
