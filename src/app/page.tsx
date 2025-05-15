
'use client';

import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Changed from Textarea
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { answerLegalQuestion } from '@/ai/flows/answer-legal-question'; // New primary flow
import type { ILegalAnswer } from '@/types'; // New type for the answer
import { addAnswerToHistory } from '@/lib/localStorage'; // Adapted/new history function
import { Loader2, Lightbulb, Link as LinkIcon, Info, FileText, Send, MessageCircleQuestion, Edit3, Settings2, Image as ImageIcon, Search, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<ILegalAnswer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Effect to clear previous answer when a new question is typed or page reloads
  useEffect(() => {
    if (userQuestion === '' && currentAnswer !== null) {
        // If user clears input, or on initial load if preferred
        // setCurrentAnswer(null); // Optional: clear answer if input is cleared
    }
  }, [userQuestion, currentAnswer]);


  const handleAskQuestion = async (event: FormEvent) => {
    event.preventDefault();
    if (!userQuestion.trim()) {
      toast({ title: 'Pergunta Ausente', description: 'Por favor, insira sua dúvida jurídica.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setCurrentAnswer(null);

    try {
      const result = await answerLegalQuestion({ userQuestion });
      const answerWithId: ILegalAnswer = {
        ...result,
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userQuestion: userQuestion, // ensure userQuestion from input is stored
        timestamp: Date.now(),
      };
      setCurrentAnswer(answerWithId);
      addAnswerToHistory(answerWithId); // Save to history
      toast({ title: 'Resposta Gerada!', description: 'Sua pergunta foi respondida.' });
    } catch (error: any) {
      console.error('Error answering legal question:', error);
      toast({ title: 'Erro ao Responder', description: error.message || 'Ocorreu um erro inesperado. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewQuestion = () => {
    setUserQuestion('');
    setCurrentAnswer(null);
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Search className="text-primary" /> LexQuiz AI - Assistente Jurídico
          </CardTitle>
          <CardDescription>
            Faça sua pergunta sobre legislação brasileira, e a IA buscará o artigo de lei correspondente, fornecerá uma explicação detalhada e informações adicionais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAskQuestion} className="space-y-6">
            <div>
              <label htmlFor="userQuestion" className="text-base font-medium block mb-1">Sua Pergunta Jurídica</label>
              <Input
                id="userQuestion"
                type="text"
                placeholder="Ex: Quais são os direitos fundamentais do cidadão?"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="text-base"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" disabled={isLoading || !userQuestion.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Perguntar à IA
              </Button>
              <Button type="button" variant="outline" onClick={handleNewQuestion} disabled={isLoading} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" />
                Nova Pergunta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && !currentAnswer && (
        <div className="flex flex-col items-center justify-center p-10 space-y-3">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Analisando sua pergunta e buscando informações...</p>
        </div>
      )}

      {currentAnswer && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageCircleQuestion className="text-primary"/> Resposta para: <span className="italic">"{currentAnswer.userQuestion}"</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><FileText className="text-primary"/> Artigo de Lei Identificado</h3>
              <Alert variant="default" className="bg-muted/50">
                <AlertDescription className="whitespace-pre-wrap text-sm">{currentAnswer.citedArticle || "Nenhum artigo específico citado."}</AlertDescription>
              </Alert>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Info className="text-primary"/> Explicação Detalhada</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {currentAnswer.enhancedExplanation || currentAnswer.explanation}
              </p>
            </div>

            {currentAnswer.aiGeneratedImageDataUri && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ImageIcon className="text-primary"/> Imagem Conceitual (Gerada por IA)</h3>
                  <div className="flex justify-center items-center p-2 border rounded-md bg-muted/30">
                    <Image 
                        src={currentAnswer.aiGeneratedImageDataUri} 
                        alt="Imagem conceitual gerada por IA relacionada à questão" 
                        width={300} 
                        height={300} 
                        className="rounded-md object-contain max-w-full h-auto"
                        data-ai-hint="legal concept"
                    />
                  </div>
                   <p className="text-xs text-muted-foreground mt-1 text-center">Imagem gerada por IA. Pode não ser perfeitamente precisa.</p>
                </div>
              </>
            )}

            {currentAnswer.sourcedImageDescription && (
                 <>
                    <Separator />
                    <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><ImageIcon className="text-orange-500"/> Exemplo de Imagem de Fontes Especializadas</h3>
                        <p className="text-sm text-muted-foreground mb-2 italic">"{currentAnswer.sourcedImageDescription}"</p>
                        {currentAnswer.sourcedImageUrl && (
                            <div className="flex justify-center items-center p-2 border rounded-md bg-muted/30">
                                <Image 
                                    src={currentAnswer.sourcedImageUrl} 
                                    alt={currentAnswer.sourcedImageDescription} 
                                    width={300} 
                                    height={200} // Adjusted for placeholder text
                                    className="rounded-md object-cover max-w-full h-auto"
                                    data-ai-hint="legal illustration"
                                />
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 text-center">Esta é uma descrição e um placeholder de uma imagem que poderia ser encontrada em materiais de estudo.</p>
                    </div>
                 </>
            )}
            
            {(currentAnswer.aiGeneratedMnemonics && currentAnswer.aiGeneratedMnemonics.length > 0) && (
              <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Lightbulb className="text-primary"/> Macetes (Gerados por IA)</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {currentAnswer.aiGeneratedMnemonics.map((mnemonic, idx) => (
                    <li key={`ai-mne-${idx}`}>{mnemonic}</li>
                  ))}
                </ul>
              </div>
              </>
            )}

            {currentAnswer.sourcedMnemonic && (
                 <>
                    <Separator />
                    <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Lightbulb className="text-orange-500"/> Exemplo de Macete de Fontes Especializadas</h3>
                        <p className="text-muted-foreground italic">"{currentAnswer.sourcedMnemonic}"</p>
                         <p className="text-xs text-muted-foreground mt-1">Este é um exemplo de mnemônico que poderia ser encontrado em materiais de estudo.</p>
                    </div>
                 </>
            )}
            
            {currentAnswer.externalSearchLinks && currentAnswer.externalSearchLinks.length > 0 && (
               <>
               <Separator />
               <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><LinkIcon className="text-primary"/> Links Úteis (Pesquisa Web Simulada)</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {currentAnswer.externalSearchLinks.map((link, idx) => (
                    <li key={`ext-link-${idx}`}><a href={link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{link.startsWith('http') ? link : `http://${link}`}</a></li>
                  ))}
                </ul>
              </div>
              </>
            )}
          </CardContent>
           <CardFooter>
            <Button onClick={handleNewQuestion} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" /> Fazer Nova Pergunta
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
