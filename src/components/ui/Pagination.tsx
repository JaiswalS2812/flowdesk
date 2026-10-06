import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaginationProps {
  page: number;          // zero-based
  totalPages: number;
  totalElements: number;
  size: number;
  itemLabel: string;     // plural, e.g. "tickets"
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

// "Showing 21–40 of 95 tickets" with previous/next buttons; hidden when everything fits on one page
export function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  itemLabel,
  onPageChange,
  disabled,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const first = page * size + 1;
  const last = Math.min((page + 1) * size, totalElements);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100"
    >
      <p className="text-xs text-slate-500">
        Showing {first}–{last} of {totalElements} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          disabled={disabled || page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          disabled={disabled || page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
