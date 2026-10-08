import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

interface PaginationProps {
  page: number; // zero-based
  totalPages: number;
  totalElements: number;
  size: number;
  itemLabel: string; // plural, e.g. "tickets"
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

// Numbered pages around the current one: 1 … 4 5 6 … 12
function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set([0, total - 1, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

// "Showing 21–40 of 95 tickets"; always shows the range, controls only when there is more than one page
export function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  itemLabel,
  onPageChange,
  disabled,
  className,
}: PaginationProps) {
  if (totalElements === 0) return null;
  const first = page * size + 1;
  const last = Math.min((page + 1) * size, totalElements);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3', className)}
    >
      <p className="text-xs text-fg-muted tabular">
        Showing <span className="font-medium text-fg">{first}–{last}</span> of{' '}
        <span className="font-medium text-fg">{totalElements.toLocaleString()}</span> {itemLabel}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeft className="size-3.5" />}
            disabled={disabled || page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            <span className="hidden sm:inline">Previous</span>
            <span className="sr-only sm:hidden">Previous page</span>
          </Button>
          <div className="hidden items-center gap-0.5 sm:flex">
            {pageWindow(page, totalPages).map((p, i) =>
              p === 'gap' ? (
                <span key={`gap-${i}`} className="px-1.5 text-xs text-fg-subtle">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  disabled={disabled}
                  aria-current={p === page ? 'page' : undefined}
                  aria-label={`Page ${p + 1}`}
                  className={cn(
                    'h-8 min-w-8 rounded-md px-2 text-xs font-medium tabular transition-colors cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    p === page ? 'bg-accent-soft text-accent-soft-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
                  )}
                >
                  {p + 1}
                </button>
              )
            )}
          </div>
          <span className="px-2 text-xs text-fg-muted sm:hidden">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ChevronRight className="size-3.5" />}
            disabled={disabled || page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sr-only sm:hidden">Next page</span>
          </Button>
        </div>
      )}
    </nav>
  );
}
