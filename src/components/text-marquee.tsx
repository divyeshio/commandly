"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface TextMarqueeProps {
  children: React.ReactNode[];
  speed?: number;
  className?: string;
  prefix?: React.ReactNode;
  height?: number;
}

export function TextMarquee({
  children,
  speed = 1,
  className,
  prefix,
  height = 200,
}: TextMarqueeProps) {
  const count = React.Children.count(children);

  return (
    <>
      <style>
        {`
          @keyframes slide-vertical {
            to {
              translate: 0 var(--destination);
            }
          }
        `}
      </style>
      <div className={cn("relative flex", className)}>
        <div className="relative flex h-min w-min flex-row items-center gap-1 overflow-hidden">
          {prefix && <div className="relative size-auto whitespace-pre">{prefix}</div>}
          <div
            className="relative w-auto overflow-hidden mask-[linear-gradient(rgba(0,0,0,0)_0%,rgb(0,0,0)_43.6902%,rgba(0,0,0,0)_100%)] opacity-100"
            style={{ height: `${height}px` }}
          >
            <div
              className="relative h-full"
              style={
                {
                  "--count": count,
                  "--speed": speed,
                } as React.CSSProperties
              }
            >
              {React.Children.map(children, (child, index) => (
                <div
                  key={index}
                  className="flex h-[40px] items-center"
                  style={
                    {
                      "--index": index,
                      "--origin": `calc((var(--count) - var(--index)) * 100%)`,
                      "--destination": `calc((var(--index) + 1) * -100%)`,
                      "--duration": `calc(var(--speed) * ${count}s)`,
                      "--delay": `calc((var(--duration) / var(--count)) * var(--index) - var(--duration))`,
                      translate: `0 var(--origin)`,
                      animation: `slide-vertical var(--duration) var(--delay) infinite linear`,
                    } as React.CSSProperties
                  }
                >
                  {child}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
