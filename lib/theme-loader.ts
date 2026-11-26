/**
 * Theme Loader
 * Fetches and applies custom theme colors from database
 * Falls back to default CSS values if not found
 */

// API Base URL - Use environment variable or fallback to production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  successColor?: string;
  warningColor?: string;
  dangerColor?: string;
  infoColor?: string;
}

// Module-level cache — avoids re-fetching on every component mount
let themeCache: ThemeSettings | null = null;
let themeLoaded = false;

/** Clear the module-level theme cache (call after saving new settings). */
export function invalidateThemeCache(): void {
  themeCache = null;
  themeLoaded = false;
}

/**
 * Fetch theme settings from backend
 * Client-side only function
 */
export async function fetchThemeSettings(): Promise<ThemeSettings | null> {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return null;
  }

  // Return cached result to avoid repeated network calls
  if (themeLoaded) return themeCache;

  try {
    console.log('Fetching theme settings from:', `${API_BASE_URL}/setting`);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/setting`, {
      headers,
    });

    if (!response.ok) {
      console.warn('Failed to fetch theme settings, status:', response.status);
      themeLoaded = true;
      themeCache = null;
      return null;
    }

    const settings = await response.json();
    console.log('Theme settings received:', settings);
    
    // Assuming first setting record contains theme colors
    if (settings && settings.length > 0) {
      themeCache = {
        primaryColor: settings[0].primaryColor,
        secondaryColor: settings[0].secondaryColor,
        successColor: settings[0].successColor,
        warningColor: settings[0].warningColor,
        dangerColor: settings[0].dangerColor,
        infoColor: settings[0].infoColor,
      };
    }
    themeLoaded = true;
    return themeCache;
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    themeLoaded = true;
    themeCache = null;
    return null;
  }
}

// Text colours used on top of a themed background (same values as the light/dark defaults in globals.css).
const LIGHT_FOREGROUND = 'oklch(0.985 0 0)';
const DARK_FOREGROUND = 'oklch(0.21 0.006 285.885)';

/** Any CSS colour (oklch, hex, rgb…) -> [r, g, b] 0-255, by painting one canvas pixel. Null if unparseable. */
function cssColorToRgb(color: string): [number, number, number] | null {
  if (typeof document === 'undefined' || !CSS.supports('color', color)) return null;
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/**
 * Pick light or dark text for a background colour, whichever has the higher WCAG contrast.
 * Client admins choose theme colours freely, so a dark secondary must not keep the default dark text.
 */
export function readableForeground(background: string): string | null {
  const rgb = cssColorToRgb(background);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithBlack ? LIGHT_FOREGROUND : DARK_FOREGROUND;
}

/** Set a themed colour and, when it has a paired text variable, a readable text colour for it. */
function setThemedColor(root: HTMLElement, name: string, value: string, foregroundName?: string) {
  root.style.setProperty(name, value);
  if (!foregroundName) return;
  const fg = readableForeground(value);
  if (fg) root.style.setProperty(foregroundName, fg);
  else root.style.removeProperty(foregroundName);
}

/**
 * Apply theme colors to CSS variables
 * This function runs on client-side to override default CSS values
 */
export function applyThemeColors(theme: ThemeSettings) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  console.log('Applying theme colors:', theme);

  // Apply primary color if exists
  if (theme.primaryColor) {
    setThemedColor(root, '--primary', theme.primaryColor, '--primary-foreground');
    console.log('Primary color applied:', theme.primaryColor);
  }

  // Apply secondary color if exists
  if (theme.secondaryColor) {
    setThemedColor(root, '--secondary', theme.secondaryColor, '--secondary-foreground');
  }

  // Apply other colors as needed
  if (theme.successColor) {
    root.style.setProperty('--success', theme.successColor);
  }

  if (theme.warningColor) {
    root.style.setProperty('--warning', theme.warningColor);
  }

  if (theme.dangerColor) {
    root.style.setProperty('--destructive', theme.dangerColor);
  }

  if (theme.infoColor) {
    root.style.setProperty('--info', theme.infoColor);
  }
}

/**
 * Load and apply theme on client-side
 * Call this from a Client Component
 */
export async function loadAndApplyTheme() {
  const theme = await fetchThemeSettings();
  if (theme) {
    applyThemeColors(theme);
  }
}

/**
 * Reset theme to defaults (remove custom overrides)
 */
export function resetThemeToDefault() {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  
  // Remove custom properties to fall back to CSS defaults
  root.style.removeProperty('--primary');
  root.style.removeProperty('--primary-foreground');
  root.style.removeProperty('--secondary');
  root.style.removeProperty('--secondary-foreground');
  root.style.removeProperty('--success');
  root.style.removeProperty('--warning');
  root.style.removeProperty('--destructive');
  root.style.removeProperty('--info');
}
