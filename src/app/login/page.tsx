
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Chrome } from 'lucide-react'; // Chrome icon for Google
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard'); // Redirect if already logged in
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    // You can specify a callbackUrl if you want to redirect to a specific page after login
    const result = await signIn('google', { callbackUrl: '/dashboard', redirect: false }); // Added redirect: false to handle error here
    if (result?.error) {
      let description = `Ocorreu um erro ao tentar fazer login com o Google. Por favor, tente novamente. Detalhe: ${result.error}`;
      if (result.error === 'OAuthAccountNotLinked') {
        description = 'Esta conta Google já está vinculada ou você tentou usar um método diferente para uma conta existente.';
      } else if (result.error.toLowerCase().includes('invalid_client') || result.error.toLowerCase().includes('client_not_found')) {
        description = 'Erro de autenticação com o Google (invalid_client): Verifique se o GOOGLE_CLIENT_ID está configurado corretamente nas variáveis de ambiente (Vercel/local) e se corresponde a um cliente OAuth válido no Google Cloud Console. Consulte os "URIs de redirecionamento autorizados" também.';
      } else if (result.error.toLowerCase().includes('redirect_uri_mismatch')) {
        description = 'Erro de autenticação com o Google (redirect_uri_mismatch): Verifique os "URIs de redirecionamento autorizados" no seu cliente OAuth no Google Cloud Console. Para local: http://localhost:9002/api/auth/callback/google. Para Vercel: https://SEU_DOMINIO_VERCEL/api/auth/callback/google.';
      }
      
      toast({
        title: 'Erro de Login com Google',
        description: description,
        variant: 'destructive',
        duration: 10000, // Increased duration for more complex error messages
      });
    } else if (result?.ok && result?.url) {
        router.push(result.url); // Manually redirect if signIn was ok and redirect:false was used
    } else if (result?.ok && !result.url) {
        // This case might happen if callbackUrl was the current page or not effectively processed.
        // If already on dashboard due to session, this is fine. If not, might need to push to dashboard.
        if(status !== 'authenticated'){
             router.push('/dashboard');
        }
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }
  
  if (status === 'authenticated') {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Login bem-sucedido! Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <LogIn className="text-primary" /> Acessar DantasAI
          </CardTitle>
          <CardDescription>Use sua conta Google para acessar o painel.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pt-6">
          <Button onClick={handleGoogleSignIn} className="w-full bg-primary hover:bg-primary/90 py-3 text-base sm:text-lg flex items-center justify-center gap-2">
            <Chrome className="h-5 w-5" /> Entrar com Google
          </Button>
           <p className="text-xs text-muted-foreground text-center pt-2">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade (exemplos).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
