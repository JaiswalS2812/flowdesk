import type { Metadata } from 'next';

// The page is a client component, so its tab title is set here (root template: "%s · FlowDesk")
export const metadata: Metadata = { title: 'Account' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
