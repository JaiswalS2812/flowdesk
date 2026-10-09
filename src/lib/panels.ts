// Floating panels (notifications, assistant) both span the screen width on phones, so opening
// one closes the other there. On wider screens they sit apart and may stay open together.

type PanelId = 'notifications' | 'assistant';

const EVENT = 'flowdesk:panel-open';
const PHONE = '(max-width: 639px)'; // below Tailwind's `sm`, where both panels go full width

export function announcePanelOpen(id: PanelId) {
  window.dispatchEvent(new CustomEvent<PanelId>(EVENT, { detail: id }));
}

// Calls `close` when another panel opens on a phone-sized screen; returns the unsubscribe
export function onOtherPanelOpen(id: PanelId, close: () => void) {
  const handler = (e: Event) => {
    if ((e as CustomEvent<PanelId>).detail !== id && window.matchMedia(PHONE).matches) close();
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
