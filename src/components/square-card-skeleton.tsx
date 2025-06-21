import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function SkeletonCard() {
  return (
    <Card className="group relative overflow-hidden">
      <CardContent className="p-6 flex flex-col items-center justify-center gap-4 min-h-[200px]">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </CardContent>
    </Card>
  );
}
