import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/utils';

/**
 * Tables use `table-layout: fixed` with explicit column widths (via <Col>): long content such
 * as audit details wraps inside its column instead of widening the table and pushing later
 * columns (timestamps) out of view. `minWidth` keeps columns readable; below it the table
 * scrolls horizontally inside its card rather than squeezing.
 */
export function Table({
  children,
  minWidth,
  className,
  caption,
}: {
  children: React.ReactNode;
  minWidth?: number;
  className?: string;
  caption?: string;
}) {
  return (
    <div className={cn('w-full overflow-x-auto overscroll-x-contain', className)}>
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

// Column width: a fixed width ("w-40" → width) or nothing for the flexible column
export function Col({ width }: { width?: number | string }) {
  return <col style={width !== undefined ? { width } : undefined} />;
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="[&_th]:sticky [&_th]:top-0">{children}</thead>;
}

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
  align?: 'left' | 'right' | 'center';
}

export function Th({ children, className, sortable, sorted, onSort, align = 'left', ...props }: ThProps) {
  const content = sortable ? (
    <button
      type="button"
      onClick={onSort}
      className={cn(
        'group inline-flex items-center gap-1 rounded uppercase tracking-wider transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
        sorted && 'text-fg'
      )}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUp className="size-3 text-accent-soft-fg" aria-hidden />
      ) : sorted === 'desc' ? (
        <ArrowDown className="size-3 text-accent-soft-fg" aria-hidden />
      ) : (
        <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
      )}
    </button>
  ) : (
    children
  );
  return (
    <th
      scope="col"
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : sortable ? 'none' : undefined}
      className={cn(
        'border-b border-line bg-surface-2/70 px-4 py-2.5 align-middle text-[11px] font-semibold uppercase tracking-wider text-fg-subtle backdrop-blur',
        // Browsers centre <th> by default; set the alignment explicitly so headers line up with cells
        align === 'left' && 'text-left',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {content}
    </th>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="[&>tr:last-child>td]:border-b-0">{children}</tbody>;
}

interface TrProps extends React.HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
  muted?: boolean;
  highlight?: boolean;
}

export function Tr({ children, className, interactive, muted, highlight, ...props }: TrProps) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100',
        interactive && 'cursor-pointer hover:bg-surface-2/70',
        highlight && 'bg-accent-soft/40',
        muted && '[&>td]:text-fg-subtle',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right' | 'center';
}

export function Td({ children, className, align = 'left', ...props }: TdProps) {
  return (
    <td
      className={cn(
        'border-b border-line px-4 py-3 align-middle text-[13px] leading-relaxed text-fg',
        align === 'left' && 'text-left',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}
