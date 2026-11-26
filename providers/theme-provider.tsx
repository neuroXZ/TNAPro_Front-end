"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { applyStoredTheme, loadAndApplyTheme } from "@/lib/theme-loader";

/**
 * Applies the client's brand colours on every page, login included (they come
 * from a public endpoint). The inline script in the root layout already put
 * the last known colours on <html> before first paint; this re-applies them
 * after React's dev remount and then fetches the current ones. A failed fetch
 * is retried on the next navigation (only a success is cached).
 */
export function ConditionalThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    applyStoredTheme();
  }, []);

  useEffect(() => {
    loadAndApplyTheme().catch((error) => console.error('Theme loading failed:', error));
  }, [pathname]);

  return <>{children}</>;
}

/**
 * Legacy ThemeProvider for backward compatibility
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ConditionalThemeProvider>{children}</ConditionalThemeProvider>
    </NextThemesProvider>
  );
}
