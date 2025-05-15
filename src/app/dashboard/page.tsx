
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Em um app real, você usaria useSession do NextAuth para obter dados do usuário
// import { useSession, signOut } from "next-auth/react";

export default function DashboardPage() {
  const { toast } = useToast();
  // const { data: session, status } = useSession(); // Exemplo NextAuth

  // if (status === "loading") {
  //   return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Carregando...</p></div>;
  // }

  // if (status === "unauthenticated") {
  //   // router.push('/login'); // Redireciona para login se não autenticado
  //   return <div className="text-center mt-10"><p>Você precisa estar logado para ver esta página.</p><Link href="/login" className="text-primary hover:underline">Ir para Login</Link></div>;
  // }

  const handleSignOut = async () => {
    // await signOut({ redirect: false }); // Exemplo NextAuth
    toast({ title: 'Logout (Simulado)', description: 'Redirecionando para login...' });
    // router.push('/login'); // Redirecionar para login
    console.log("Simulando logout...");
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <LayoutDashboard className="text-primary" /> Painel do Usuário
          </CardTitle>
          <CardDescription>
            Bem-vindo ao seu painel, {/* session?.user?.email || */ 'Usuário'}! Esta área seria protegida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Conteúdo do seu painel de usuário iria aqui.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Funcionalidades de usuário como gerenciamento de perfil, questões salvas na nuvem (se implementado com backend), etc., seriam acessadas a partir daqui.
          </p>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sair (Simulado)
          </Button>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl">Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
            <p>Para implementar a autenticação real e proteção de rotas, você precisaria integrar uma solução como NextAuth.js:</p>
            <ul className="list-disc pl-5 text-muted-foreground">
                <li>Instalar `next-auth`.</li>
                <li>Configurar provedores de autenticação (ex: Credentials para email/senha, Google OAuth).</li>
                <li>Criar rotas de API para NextAuth (ex: `src/app/api/auth/[...nextauth]/route.ts`).</li>
                <li>Proteger esta página de Dashboard e outras rotas relevantes.</li>
                <li>Gerenciar sessões de usuário.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
