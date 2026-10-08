import React from 'react';
import { cn } from '@/utils';

// Wraps an email address at the "@" (not mid-word) when it does not fit on one line
export function Email({ value, className }: { value: string; className?: string }) {
  const at = value.indexOf('@');
  if (at <= 0) return <span className={cn('[overflow-wrap:anywhere]', className)}>{value}</span>;
  return (
    <span className={cn('[overflow-wrap:break-word]', className)}>
      {value.slice(0, at)}
      <wbr />@{value.slice(at + 1)}
    </span>
  );
}
