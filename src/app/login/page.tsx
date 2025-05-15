
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação de chamada de API de login
    // Em um app real, você chamaria signIn() do NextAuth aqui
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Exemplo de como seria com NextAuth (NÃO FUNCIONAL SEM NEXTAUTH CONFIGURADO):
    // const result = await signIn('credentials', {
    //   redirect: false,
    //   email,
    //   password,
    // });
    // if (result?.error) {
    //   toast({ title: 'Erro de Login', description: result.error, variant: 'destructive' });
    // } else if (result?.ok) {
    //   toast({ title: 'Login bem-sucedido!', description: 'Redirecionando...' });
    //   // router.push('/dashboard'); // Redirecionar para o dashboard
    // }

    toast({
      title: 'Login (Simulado)',
      description: 'Funcionalidade de login real precisa ser implementada com NextAuth.js ou similar.',
      variant: 'default',
    });
    console.log('Login attempt with:', { email, password });
    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <LogIn className="text-primary" /> Acessar DantasAI
          </CardTitle>
          <CardDescription>Entre com suas credenciais para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="text-base"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Entrar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-start text-sm">
           <p className="text-muted-foreground">
            Ainda não tem uma conta?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Registre-se aqui
            </Link>
            {' '} (Página de registro não implementada).
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Nota: Este é um formulário de login visual. A autenticação real precisa ser implementada.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
