'use client';

import React from 'react';
import { Monitor, Moon, Sun, Coffee } from 'lucide-react';
import { useTheme, ThemePreference } from '@/contexts/ThemeContext';
import { SegmentedControl } from '@/components/ui/Controls';

export const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'system', label: 'System', icon: <Monitor />, description: 'Follow your device setting' },
  { value: 'light', label: 'Light', icon: <Sun />, description: 'Bright and crisp' },
  { value: 'dark', label: 'Dark', icon: <Moon />, description: 'Low light, high focus' },
  { value: 'warm', label: 'Warm', icon: <Coffee />, description: 'Soft paper tones for long sessions' },
];

export function ThemeSwitcher({ size = 'sm', showLabels }: { size?: 'sm' | 'md'; showLabels?: boolean }) {
  const { preference, setPreference } = useTheme();
  return (
    <SegmentedControl
      label="Theme"
      value={preference}
      onChange={setPreference}
      options={THEME_OPTIONS.map(({ value, label, icon }) => ({ value, label, icon }))}
      iconOnly={!showLabels}
      size={size}
    />
  );
}
