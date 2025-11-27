"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { loadAndApplyTheme } from "@/lib/theme-loader";

/**
 * ConditionalThemeProvider Component
 * Only loads theme for authenticated pages
 * Skips public pages to avoid fetch errors
 */
export function ConditionalThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [themeLoaded, setThemeLoaded] = useState(false);
  
  // List of public pages that don't need theme loading
  const publicPages = ['/login', '/signup', '/'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    // Only load theme for non-public pages and if not already loaded
    if (!isPublicPage && !themeLoaded) {
      console.log('Loading theme from database...');
      loadAndApplyTheme()
        .then(() => {
          console.log('Theme loaded and applied successfully');
          setThemeLoaded(true);
        })
        .catch((error) => {
          console.error('Theme loading failed:', error);
          setThemeLoaded(true); // Mark as attempted
        });
    }
  }, [isPublicPage, themeLoaded]);

  return <>{children}</>;
}

/**
 * Legacy ThemeProvider for backward compatibility
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ConditionalThemeProvider>{children}</ConditionalThemeProvider>;
}
