import { Skeleton } from "@/components/ui/skeleton"

export function ResultTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[200px]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </div>
    </div>
  )
}
