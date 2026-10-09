'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'warm';
export type ThemePreference = Theme | 'system';

const STORAGE_KEY = 'flowdesk_theme';

/**
 * Runs in <head> before the first paint (see app/layout.tsx), so the stored theme is applied
 * without a flash. Without a stored choice the OS light/dark preference is used. The collapsed
 * desktop sidebar is restored the same way.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}');var t=(p==='light'||p==='dark'||p==='warm')?p:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);if(localStorage.getItem('flowdesk_sidebar')==='collapsed'){document.documentElement.setAttribute('data-sidebar','collapsed');}}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

interface ThemeContextValue {
  preference: ThemePreference;
  theme: Theme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'warm') return stored;
  } catch {
    // Storage unavailable (private mode): fall back to the system theme
  }
  return 'system';
}

function apply(theme: Theme, animate: boolean) {
  const root = document.documentElement;
  if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 320);
  }
  root.setAttribute('data-theme', theme);
  syncThemeColor();
}

// The viewport theme-color tags follow only the OS scheme (app/layout.tsx); point them at the
// applied theme's canvas so the mobile browser bar matches a chosen Light, Dark or Warm theme
function syncThemeColor() {
  const canvas = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
  if (!canvas) return;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', canvas));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The server cannot know the stored theme; the init script has already applied it to the
  // document, and these values catch up on mount
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const pref = readPreference();
    /* eslint-disable react-hooks/set-state-in-effect -- client-only hydration from localStorage */
    setPreferenceState(pref);
    setTheme(pref === 'system' ? systemTheme() : pref);
    /* eslint-enable react-hooks/set-state-in-effect */
    syncThemeColor(); // the init script already applied the theme before paint
  }, []);

  // Follow OS changes while the preference is "system"
  useEffect(() => {
    if (preference !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = systemTheme();
      setTheme(next);
      apply(next, true);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisted, still applied for this page view
    }
    const resolved = next === 'system' ? systemTheme() : next;
    setPreferenceState(next);
    setTheme(resolved);
    apply(resolved, true);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, theme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
