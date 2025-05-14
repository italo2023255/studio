'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, MessageSquareHeart } from 'lucide-react';
import { useState } from 'react';

const feedbackFormSchema = z.object({
  feedbackText: z.string().min(10, { message: 'O feedback deve ter pelo menos 10 caracteres.' }).max(2000, { message: 'O feedback não pode exceder 2000 caracteres.' }),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export default function FeedbackPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      feedbackText: '',
    },
  });

  const onSubmit: SubmitHandler<FeedbackFormValues> = async (data) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Feedback submitted:', data.feedbackText);
    
    toast({
      title: 'Feedback Enviado!',
      description: 'Obrigado por sua contribuição. Nós valorizamos sua opinião.',
    });
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <MessageSquareHeart className="text-primary" /> Envie seu Feedback
          </CardTitle>
          <CardDescription>
            Sua opinião é muito importante para nós! Deixe suas sugestões, dúvidas ou reporte problemas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="feedbackText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="feedbackText" className="text-base">Sua mensagem</FormLabel>
                    <FormControl>
                      <Textarea
                        id="feedbackText"
                        placeholder="Digite seu feedback aqui..."
                        rows={8}
                        className="text-base resize-none"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Feedback
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
