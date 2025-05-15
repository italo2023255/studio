
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from 'next-auth/react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DantasAI',
  description: 'Gere questões jurídicas com IA e aprimore seus estudos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background`}
      >
        <SessionProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 md:px-6 pb-24"> {/* pb-24 para espaço da BottomNavigation */}
            {children}
          </main>
          <BottomNavigation />
          <Toaster />
          <footer className="py-6 text-center text-sm text-muted-foreground border-t print:hidden">
            © {new Date().getFullYear()} DantasAI. Todos os direitos reservados.
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
