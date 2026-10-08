import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { buttonClasses } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="max-w-sm text-center animate-enter">
        <LogoMark className="mx-auto size-11" animated />
        <p className="mt-6 font-mono text-sm text-fg-subtle">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">Page not found</h1>
        <p className="mt-2 text-sm text-fg-muted">The page you are looking for doesn&apos;t exist or has moved.</p>
        <Link href="/dashboard" className={buttonClasses('primary', 'md', 'mt-6')}>
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
