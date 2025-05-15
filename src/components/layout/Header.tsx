import Link from 'next/link';
import { LogoIcon } from '@/components/icons/LogoIcon';

export function Header() {
  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Página Inicial DantasAI">
          <LogoIcon className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            DantasAI
          </span>
        </Link>
      </div>
    </header>
  );
}
