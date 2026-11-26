/**
 * Theme Loader
 *
 * The client's brand colours live in Setting and are applied as CSS variables
 * on <html>, so every component styled with the theme tokens (bg-primary,
 * text-secondary-foreground, …) follows them.
 *
 * - Colours come from the public endpoint /public/setting/theme, so the login
 *   page is themed too and nothing depends on being logged in. (The old
 *   authenticated /setting fetch ran on the login page without a token, got a
 *   401, cached "no theme" and kept the default colours until a full reload.)
 * - The resolved variables are also kept in localStorage and re-applied by an
 *   inline script in <head> (THEME_INLINE_SCRIPT) before the first paint, so a
 *   page load doesn't flash the default colours while the fetch runs.
 */

// API Base URL - Use environment variable or fallback to production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ThemeSettings {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  successColor?: string | null;
  warningColor?: string | null;
  dangerColor?: string | null;
  infoColor?: string | null;
}

// Every CSS variable this module may set on <html>, so a reset or a new theme
// clears the ones the previous theme set.
const MANAGED_VARS = [
  '--primary', '--primary-foreground', '--secondary', '--secondary-foreground',
  '--success', '--warning', '--destructive', '--info',
] as const;

// localStorage key holding { "--var": "value" } of the last applied theme.
// Per origin, and each client has its own site, so it is per client.
const THEME_STORAGE_KEY = 'tnapro-theme-vars';

/**
 * Runs synchronously in <head> before first paint: re-applies the last theme
 * from localStorage. Kept tiny and dependency-free; only sets CSS custom
 * properties whose names look like ours.
 */
export const THEME_INLINE_SCRIPT = `(function(){try{var v=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"null");if(v&&typeof v==="object"){var s=document.documentElement.style;for(var k in v){if(/^--[a-z-]+$/.test(k)&&typeof v[k]==="string")s.setProperty(k,v[k])}}}catch(e){}})()`;

// Module-level cache — one fetch per page load. Only a successful fetch is
// cached, so a failure (network, backend restarting) is retried later.
let themeCache: ThemeSettings | null = null;
let themeLoaded = false;

/** Clear the module-level theme cache (call after saving new settings). */
export function invalidateThemeCache(): void {
  themeCache = null;
  themeLoaded = false;
}

async function fetchJson(url: string, headers?: HeadersInit): Promise<{ ok: boolean; status: number; body: any }> {
  const response = await fetch(url, { headers });
  return { ok: response.ok, status: response.status, body: response.ok ? await response.json() : null };
}

/**
 * Fetch theme settings from backend
 * Client-side only function
 */
export async function fetchThemeSettings(): Promise<ThemeSettings | null> {
  if (typeof window === 'undefined') return null;
  if (themeLoaded) return themeCache;

  try {
    const pub = await fetchJson(`${API_BASE_URL}/public/setting/theme`);
    if (pub.ok) {
      themeCache = pub.body ?? null;
      themeLoaded = true;
      return themeCache;
    }

    // Backend not yet on the public endpoint (404): fall back to the
    // authenticated list while logged in. Remove once every backend has it.
    const token = localStorage.getItem('token');
    if (pub.status === 404 && token) {
      const res = await fetchJson(`${API_BASE_URL}/setting`, { Authorization: `Bearer ${token}` });
      if (res.ok) {
        const first = Array.isArray(res.body) ? res.body[0] : null;
        themeCache = first
          ? {
              primaryColor: first.primaryColor,
              secondaryColor: first.secondaryColor,
              successColor: first.successColor,
              warningColor: first.warningColor,
              dangerColor: first.dangerColor,
              infoColor: first.infoColor,
            }
          : null;
        themeLoaded = true;
        return themeCache;
      }
    }
    console.warn('Failed to fetch theme settings, status:', pub.status);
    return null;
  } catch (error) {
    console.error('Error fetching theme settings:', error);
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

/**
 * The CSS variables a theme sets: each colour, plus a readable text colour for
 * the two that have a paired foreground (a colour that can't be parsed gets no
 * foreground, so the stylesheet default stays).
 */
function computeThemeVars(theme: ThemeSettings): Record<string, string> {
  const vars: Record<string, string> = {};
  const set = (name: string, value: string | null | undefined, foregroundName?: string) => {
    if (!value) return;
    vars[name] = value;
    if (!foregroundName) return;
    const fg = readableForeground(value);
    if (fg) vars[foregroundName] = fg;
  };
  set('--primary', theme.primaryColor, '--primary-foreground');
  set('--secondary', theme.secondaryColor, '--secondary-foreground');
  set('--success', theme.successColor);
  set('--warning', theme.warningColor);
  set('--destructive', theme.dangerColor);
  set('--info', theme.infoColor);
  return vars;
}

function setRootVars(vars: Record<string, string>) {
  const style = document.documentElement.style;
  for (const name of MANAGED_VARS) {
    if (vars[name]) style.setProperty(name, vars[name]);
    else style.removeProperty(name);
  }
}

function storeVars(vars: Record<string, string> | null) {
  try {
    if (vars && Object.keys(vars).length > 0) localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(vars));
    else localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Storage blocked (private mode etc.): the theme still applies, just not before first paint.
  }
}

/**
 * Apply theme colors to CSS variables, replacing any previous theme, and
 * remember them for the next page load.
 */
export function applyThemeColors(theme: ThemeSettings) {
  if (typeof window === 'undefined') return;
  const vars = computeThemeVars(theme);
  setRootVars(vars);
  storeVars(vars);
  themeCache = { ...theme };
  themeLoaded = true;
}

/**
 * Re-apply the last stored theme. The inline <head> script does this before
 * first paint; this covers React's dev-mode remount, which resets <html>.
 */
export function applyStoredTheme() {
  if (typeof window === 'undefined') return;
  try {
    const vars = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || 'null');
    if (vars && typeof vars === 'object') setRootVars(vars);
  } catch {
    // Nothing stored or storage blocked: the fetch below still applies the theme.
  }
}

/**
 * Load and apply theme on client-side
 * Call this from a Client Component
 */
export async function loadAndApplyTheme() {
  const theme = await fetchThemeSettings();
  // null = fetch failed: keep whatever the stored theme already applied.
  if (theme !== null) applyThemeColors(theme);
}

/**
 * Reset theme to defaults (remove custom overrides)
 */
export function resetThemeToDefault() {
  if (typeof window === 'undefined') return;
  setRootVars({});
  storeVars(null);
}
