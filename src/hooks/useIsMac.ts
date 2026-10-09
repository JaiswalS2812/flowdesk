'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const isMacPlatform = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

// Whether shortcut hints should show ⌘ instead of Ctrl. False during server rendering, so the
// hint starts as "Ctrl" and switches after hydration without a mismatch.
export function useIsMac(): boolean {
  return useSyncExternalStore(subscribe, isMacPlatform, () => false);
}
