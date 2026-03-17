import { Skeleton } from "@/components/ui/skeleton"

export function PositionCompetencyTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[180px] ml-auto" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-8 w-[180px] ml-auto" />
        </div>
      ))}
    </div>
  )
}
