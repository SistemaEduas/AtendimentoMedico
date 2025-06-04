import { Skeleton } from "@/components/ui/skeleton"

export default function AssinaturaLoading() {
  return (
    <div className="container mx-auto py-6">
      <Skeleton className="h-8 w-48 mb-6" />

      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  )
}
