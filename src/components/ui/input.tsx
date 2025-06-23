import * as React from "react";

import { cn } from "@/lib/utils";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva } from "class-variance-authority";

export type InputRootProps = React.ComponentProps<"div">;

function InputRoot({ children, className, ...props }: InputRootProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
}

function InputIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SlotPrimitive.Slot
      role="presentation"
      className={cn(
        "absolute left-3 top-2 bottom-2 pointer-events-none size-5 [&~input]:pl-11",
        className,
      )}
    >
      {children}
    </SlotPrimitive.Slot>
  );
}

const inputVariants = cva(
  "flex h-9 w-full rounded-md bg-transparent border px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input shadow-xs focus-visible:ring-ring",
        destructive:
          "border-destructive shadow-xs focus-visible:ring-destructive",
        ghost: "border-transparent -mx-3 -my-1 focus-visible:ring-ring",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Input({
  className,
  type,
  placeholder,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      placeholder={placeholder}
      {...props}
    />
  );
}

export { Input, InputIcon, InputRoot, inputVariants };
