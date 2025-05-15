
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileType, History, BarChart3, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/gerar-com-pdf', label: 'PDF', icon: FileType },
  { href: '/history', label: 'Histórico', icon: History },
  { href: '/desempenho', label: 'Desempenho', icon: BarChart3 },
  { href: '/feedback', label: 'Feedback', icon: MessageSquareText },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background shadow-t-md">
      <div className="mx-auto grid h-full max-w-lg grid-cols-5 font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group inline-flex flex-col items-center justify-center px-2 py-2 text-center hover:bg-muted hover:text-primary focus:outline-none focus:bg-muted/80 focus:text-primary',
                isActive ? 'text-primary bg-muted/50' : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn('mb-1 h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary group-focus:text-primary')} />
              <span className={cn("text-[10px] sm:text-xs leading-tight", isActive ? "font-semibold text-primary" : "text-muted-foreground group-hover:text-primary group-focus:text-primary")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
