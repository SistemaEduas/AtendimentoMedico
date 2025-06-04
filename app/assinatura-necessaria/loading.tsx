import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function AssinaturaNecessariaLoading() {
  return (
    <div className="container max-w-5xl py-10">
      <div className="text-center mb-10">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
      </div>

      <Card>
        <CardHeader className="text-center border-b">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-12 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-5 w-5 mr-2" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t pt-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-3 w-full" />
        </CardFooter>
      </Card>
    </div>
  )
}
