import type { Metadata } from 'next';

// The page is a client component; the tab title comes from the route ("Ticket #42 · FlowDesk")
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: /^\d+$/.test(id) ? `Ticket #${id}` : 'Ticket' };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
