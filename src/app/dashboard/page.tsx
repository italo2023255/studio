
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import Image from 'next/image';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' }); // Redirect to login after sign out
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Carregando sua sessão...</p>
      </div>
    );
  }

  if (!session) {
     // This should ideally be caught by the useEffect redirecting to /login,
     // but as a fallback or if the redirect hasn't happened yet.
    return (
      <div className="text-center mt-20 space-y-4">
        <p className="text-xl">Você precisa estar logado para ver esta página.</p>
        <Button asChild>
            <Link href="/login">Ir para Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <LayoutDashboard className="text-primary" /> Painel do Usuário
          </CardTitle>
          <CardDescription>
            Bem-vindo(a) ao seu painel, <span className="font-semibold">{session.user?.name || session.user?.email || 'Usuário'}</span>!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session.user?.image && (
             <Image 
                src={session.user.image} 
                alt="User avatar" 
                width={64}
                height={64}
                className="rounded-full mb-4 border-2 border-primary shadow-md"
                data-ai-hint="user avatar"
             />
          )}
          <p className="mb-1"><strong>Email:</strong> {session.user?.email}</p>
          <p className="text-sm text-muted-foreground mb-6">
            Este é o seu dashboard protegido. Funcionalidades futuras podem incluir gerenciamento de perfil, questões salvas, etc.
          </p>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl">Autenticação com Google</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
            <p>Este aplicativo agora usa NextAuth.js para autenticação com o Google.</p>
            <ul className="list-disc pl-5 text-muted-foreground">
                <li>As credenciais do Google (Client ID e Client Secret) devem ser configuradas como variáveis de ambiente no servidor (localmente no `.env` e na Vercel).</li>
                <li>As variáveis `NEXTAUTH_URL` e `NEXTAUTH_SECRET` também são cruciais.</li>
                <li>A página de login foi alterada para um botão "Entrar com Google".</li>
                <li>Esta página de dashboard é um exemplo de rota protegida (se você implementar a proteção de rota adequadamente com middleware ou verificações de sessão).</li>
            </ul>
             <p className="mt-4 text-xs">
              Para proteger esta rota efetivamente, você implementaria verificações de sessão ou usaria o middleware do NextAuth.js.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
