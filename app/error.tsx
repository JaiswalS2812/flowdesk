'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { buttonClasses } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';

// Styled fallback for unexpected rendering errors; the error's message and stack are never shown
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="w-full max-w-sm text-center animate-enter">
        <LogoMark className="mx-auto size-11" />
        <ErrorState
          className="pb-0 pt-6"
          title="Something went wrong"
          description="This page ran into an unexpected problem. Try again, or return to the dashboard."
          onRetry={retry}
        />
        <Link href="/dashboard" className={buttonClasses('ghost', 'sm', 'mt-2')}>
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
