import { cn } from "@/lib/utils";
import * as React from "react";

export function Steps({ children, className }: { children: React.ReactNode; className?: string }) {
  const items = React.Children.toArray(children);
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {items.map((child, i) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { number: i + 1 } as object)
          : child,
      )}
    </div>
  );
}

export function Step({
  children,
  number,
  className,
}: {
  children: React.ReactNode;
  number?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold text-muted-foreground">
        {number}
      </div>
      <div className="flex-1 pt-0.5">{children}</div>
    </div>
  );
}
