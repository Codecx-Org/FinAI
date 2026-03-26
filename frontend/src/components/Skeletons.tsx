import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader } from "./ui/card";

export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Welcome Message */}
      <div className="text-center py-2 space-y-2">
        <Skeleton className="h-7 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Business Profit Snapshot */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-2 w-12" />
              <Skeleton className="h-4 w-8 ml-auto" />
            </div>
          </div>
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>

      {/* Recently Sold Products */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function SalesTrackerSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center space-y-2">
        <Skeleton className="h-7 w-40 mx-auto" />
        <Skeleton className="h-4 w-60 mx-auto" />
      </div>

      <div className="w-full bg-muted h-10 rounded-md p-1 grid grid-cols-2 gap-1">
        <Skeleton className="h-full w-full rounded-sm" />
        <Skeleton className="h-full w-full rounded-sm bg-background/50" />
      </div>

      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 space-y-2">
              <Skeleton className="w-8 h-8 rounded-lg mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-2 flex flex-col items-end">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function InventoryManagerSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 space-y-2 text-center">
              <Skeleton className="w-8 h-8 rounded-lg mx-auto" />
              <Skeleton className="h-4 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-full rounded-md" />

      <Card className="border-red-100 bg-red-50/30">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2 justify-end">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function BusinessInsightsSkeleton() {
  return (
    <div className="p-3 space-y-3">
      <div className="text-center pb-2 space-y-1">
        <Skeleton className="h-6 w-40 mx-auto" />
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>

      <div className="w-full bg-muted h-10 rounded-md p-1 grid grid-cols-3 gap-1">
        <Skeleton className="h-full w-full rounded-sm bg-background" />
        <Skeleton className="h-full w-full rounded-sm" />
        <Skeleton className="h-full w-full rounded-sm" />
      </div>

      <Card className="p-3 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-1.5 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-3 space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-3 border rounded-lg space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center space-y-1">
        <Skeleton className="h-7 w-24 mx-auto" />
        <Skeleton className="h-4 w-56 mx-auto" />
      </div>

      <div className="w-full bg-muted h-10 rounded-md p-1 grid grid-cols-3 gap-1">
        <Skeleton className="h-full w-full rounded-sm bg-background" />
        <Skeleton className="h-full w-full rounded-sm" />
        <Skeleton className="h-full w-full rounded-sm" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
