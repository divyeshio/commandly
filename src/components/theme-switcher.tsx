import { Button } from "./ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef } from "react";

export type Theme = "dark" | "light" | "system";

export function ThemeSwitcher() {
  const ref = useRef<HTMLButtonElement>(null);

  const { theme, setTheme } = useTheme();

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
      setTheme(theme);
    }).ready;

    const { top, left, width, height } = ref.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRadius = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  };

  return (
    <Button
      variant="link"
      size="icon"
      className="rounded-full"
      onClick={() => (theme === "dark" ? toggleDarkMode("light") : toggleDarkMode("dark"))}
      ref={ref}
    >
      {theme === "dark" ? (
        <MoonIcon className="scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      ) : (
        <SunIcon className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      )}
    </Button>
  );
}
