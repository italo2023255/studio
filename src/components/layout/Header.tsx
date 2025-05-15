
import Link from 'next/link';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { Button } from '@/components/ui/button';
import { History, Home, MessageSquareText, FileType, BarChart3 } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Página Inicial DantasAI">
          <LogoIcon className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            DantasAI
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Início</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/gerar-com-pdf" className="flex items-center gap-1">
              <FileType className="h-4 w-4" />
              <span className="hidden sm:inline">Gerar por PDF</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/history" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/desempenho" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Desempenho</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/feedback" className="flex items-center gap-1">
              <MessageSquareText className="h-4 w-4" />
              <span className="hidden sm:inline">Feedback</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
    
