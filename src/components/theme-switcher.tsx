import { MoonIcon, SunIcon } from "lucide-react";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "./ui/button";

type Theme = "dark" | "light" | "system";

export function ThemeSwitcher() {
  if (typeof window === "undefined") {
    return null;
  }
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLButtonElement>(null);

  const toggleDarkMode = async (theme: Theme) => {
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
        duration: 400,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)"
      }
    );
  };

  return (
    <Button
      size="icon"
      variant="ghost"
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


interface ThemeProviderContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<
  ThemeProviderContextType | undefined
>(undefined);

const storageKey = "ui-theme";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark"
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const isDark = theme === "dark";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem(storageKey, theme);
  }, [theme]);

  const value = {
    theme,
    setTheme
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
