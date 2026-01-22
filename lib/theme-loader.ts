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

/**
 * Fetch theme settings from backend
 * Client-side only function
 */
export async function fetchThemeSettings(): Promise<ThemeSettings | null> {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return null;
  }

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
      cache: 'no-store', // Always get fresh data
      headers,
    });

    if (!response.ok) {
      console.warn('Failed to fetch theme settings, status:', response.status);
      return null;
    }

    const settings = await response.json();
    console.log('Theme settings received:', settings);
    
    // Assuming first setting record contains theme colors
    if (settings && settings.length > 0) {
      return {
        primaryColor: settings[0].primaryColor,
        secondaryColor: settings[0].secondaryColor,
        successColor: settings[0].successColor,
        warningColor: settings[0].warningColor,
        dangerColor: settings[0].dangerColor,
        infoColor: settings[0].infoColor,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    return null;
  }
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
    root.style.setProperty('--primary', theme.primaryColor);
    console.log('Primary color applied:', theme.primaryColor);
  }

  // Apply secondary color if exists
  if (theme.secondaryColor) {
    root.style.setProperty('--secondary', theme.secondaryColor);
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
  root.style.removeProperty('--secondary');
  root.style.removeProperty('--success');
  root.style.removeProperty('--warning');
  root.style.removeProperty('--destructive');
  root.style.removeProperty('--info');
}
