import { MoonIcon, SunIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Button } from "./ui/button";

type Theme = "dark" | "light" | "system";
const storageKey = "ui-theme";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || "system"
  );
  const ref = useRef<HTMLButtonElement>(null);

  const toggleDarkMode = async (theme: Theme) => {
    /**
     * Return early if View Transition API is not supported
     * or user prefers reduced motion
     */
    if (
      !ref.current ||
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(theme);
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(theme);
      });
    }).ready;

    const { top, left, width, height } = ref.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRadius = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`
        ]
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)"
      }
    );
    localStorage.setItem(storageKey, theme);
  };

  useEffect(() => {
    if (theme == "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <Button
      variant="link"
      size="icon"
      className="rounded-full"
      onClick={() =>
        theme === "dark" ? toggleDarkMode("light") : toggleDarkMode("dark")
      }
      ref={ref}
    >
      {theme === "dark" ? (
        <MoonIcon className="rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      ) : (
        <SunIcon className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      )}
    </Button>
  );
}
