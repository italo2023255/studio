
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileType, History, BarChart3, MessageSquareText, RefreshCw, LogIn, UserCircle } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const navItemsBase = [
  { href: '/', label: 'Início', icon: Home, requiresAuth: false },
  { href: '/gerar-com-pdf', label: 'PDF', icon: FileType, requiresAuth: false },
  { href: '/history', label: 'Histórico', icon: History, requiresAuth: false }, // Consider protecting if history is user-specific
  { href: '/revisar', label: 'Revisar', icon: RefreshCw, requiresAuth: false }, // Consider protecting
  { href: '/desempenho', label: 'Desempenho', icon: BarChart3, requiresAuth: false }, // Consider protecting
  { href: '/feedback', label: 'Feedback', icon: MessageSquareText, requiresAuth: false },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navItems = [
    ...navItemsBase,
    status === 'authenticated' 
      ? { href: '/dashboard', label: 'Painel', icon: UserCircle, requiresAuth: true }
      : { href: '/login', label: 'Login', icon: LogIn, requiresAuth: false },
  ];
  
  // Adjust grid columns based on number of items (max 7 for now for simplicity)
  const gridColsClass = `grid-cols-${navItems.length > 5 ? (navItems.length > 6 ? 7 : 6) : 5}`;


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background shadow-t-md print:hidden">
      <div className={cn("mx-auto grid h-full max-w-lg font-medium", gridColsClass)}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group inline-flex flex-col items-center justify-center px-1 sm:px-2 py-2 text-center hover:bg-muted hover:text-primary focus:outline-none focus:bg-muted/80 focus:text-primary',
                isActive ? 'text-primary bg-muted/50' : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn('mb-1 h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary group-focus:text-primary')} />
              <span className={cn("text-[8px] sm:text-[10px] leading-tight", isActive ? "font-semibold text-primary" : "text-muted-foreground group-hover:text-primary group-focus:text-primary")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
