import {
  LayoutDashboard,
  Ticket,
  SquarePen,
  Users,
  ScrollText,
  ShieldCheck,
  UserRound,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react';
import { Role } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[]; // visible to these roles only (the backend enforces access regardless)
  description: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// Same audience as the backend allows; support engineers work assigned tickets and do not
// raise new ones from this navigation
export const CAN_CREATE_TICKETS: Role[] = ['EMPLOYEE', 'MANAGER', 'ADMIN'];

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview of your tickets and SLAs' },
      { label: 'Tickets', href: '/tickets', icon: Ticket, description: 'Search, filter and open tickets' },
      { label: 'New Ticket', href: '/tickets/new', icon: SquarePen, roles: CAN_CREATE_TICKETS, description: 'Submit a service request' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', href: '/users', icon: Users, roles: ['ADMIN'], description: 'Roles, departments and access' },
      { label: 'Activity', href: '/activity', icon: ScrollText, roles: ['ADMIN'], description: 'Audit log of every change' },
      { label: 'SLA Policies', href: '/sla-policies', icon: ShieldCheck, roles: ['ADMIN'], description: 'Response and resolution targets' },
    ],
  },
  {
    title: 'You',
    items: [
      { label: 'Account', href: '/account', icon: UserRound, description: 'Profile and password' },
      { label: 'Help Center', href: '/help', icon: LifeBuoy, description: 'Guides and answers' },
    ],
  },
];

export function navFor(role: Role | undefined): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
  })).filter((section) => section.items.length > 0);
}

export function isActive(pathname: string, href: string): boolean {
  if (href === '/tickets') return pathname === '/tickets' || /^\/tickets\/\d+/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Breadcrumbs derived from the route
export function breadcrumbsFor(pathname: string): { label: string; href?: string }[] {
  const ticket = pathname.match(/^\/tickets\/(\d+)/);
  if (ticket) return [{ label: 'Tickets', href: '/tickets' }, { label: `#${ticket[1]}` }];
  if (pathname === '/tickets/new') return [{ label: 'Tickets', href: '/tickets' }, { label: 'New ticket' }];
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((i) => i.href === pathname);
    if (item) {
      return section.title === 'Administration'
        ? [{ label: 'Administration' }, { label: item.label }]
        : [{ label: item.label }];
    }
  }
  return [];
}
