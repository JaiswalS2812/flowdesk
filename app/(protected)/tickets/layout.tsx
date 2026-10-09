import type { Metadata } from 'next';

// The page is a client component, so its tab title is set here. A parent title stops the root
// template from reaching nested routes, so the template is repeated for New Ticket and Ticket #42
export const metadata: Metadata = { title: { default: 'Tickets', template: '%s · FlowDesk' } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
