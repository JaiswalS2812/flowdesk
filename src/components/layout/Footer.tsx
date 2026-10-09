import React from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { Role } from '@/types';
import { CAN_CREATE_TICKETS } from '@/components/layout/nav';

// Only links to pages that exist in this application
export function Footer({ role }: { role?: Role }) {
  const product = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Tickets', href: '/tickets' },
    ...(role && CAN_CREATE_TICKETS.includes(role) ? [{ label: 'New Ticket', href: '/tickets/new' }] : []),
  ];
  const support = [
    { label: 'Help Center', href: '/help' },
    { label: 'Account & security', href: '/account' },
  ];

  // Bottom/right padding keeps the floating assistant launcher clear of footer content
  return (
    <footer className="mt-auto border-t border-line pb-16 sm:pb-0">
      <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <LogoMark className="size-6" />
            <span className="text-sm font-semibold tracking-tight text-fg">FlowDesk</span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
            Service management for internal teams: role-based ticket workflows, SLA tracking with automatic escalation and a
            complete audit trail.
          </p>
        </div>
        <FooterColumn title="Product" links={product} />
        <FooterColumn title="Support" links={support} />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-1 px-4 py-4 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pr-48 lg:px-8 lg:pr-48">
          <p>© {new Date().getFullYear()} FlowDesk</p>
          <p>Built with Next.js, Spring Boot and MySQL</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-[13px] text-fg-muted transition-colors hover:text-fg">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
