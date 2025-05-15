
'use client';

import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateQuestions } from '@/ai/flows/generate-questions';
import type { IQGeneratedQuestion, QuestionStyle, IAnsweredQuestion } from '@/types';
import { addAnswerToHistory } from '@/lib/localStorage';
import { Loader2, Lightbulb, Link as LinkIcon, Info, FileText, Send, MessageCircleQuestion, Edit3, Settings2, ImageIcon as ImageIconLucide, RotateCcw, CheckCircle, XCircle, ListChecks, FileQuestion as FileQuestionIcon, Youtube, FileType } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClientOnly } from '@/components/ClientOnly';

export default function GenerateFromPdfPage() {
  const [pdfText, setPdfText] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(1);
  const [questionStyle, setQuestionStyle] = useState<QuestionStyle>('cespe');
  const [generatedQuestions, setGeneratedQuestions] = useState<IQGeneratedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  const handleGenerateQuestions = async (event: FormEvent) => {
    event.preventDefault();
    if (!pdfText.trim()) {
      toast({ title: 'Texto do PDF Ausente', description: 'Por favor, cole o texto do PDF para gerar questões.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setGeneratedQuestions([]);
    setUserAnswers({});
    setShowFeedback({});

    try {
      const result = await generateQuestions({
        legalText: pdfText, // Use pdfText here
        numQuestions,
        questionStyle,
      });
      
      const questionsWithClientIds = result.questions.map((q, index) => ({
        ...q,
        id: `${Date.now()}-pdf-q${index}`, 
      }));
      setGeneratedQuestions(questionsWithClientIds);

      toast({ title: 'Questões Geradas!', description: `${result.questions.length} questões foram criadas com sucesso a partir do texto do PDF.` });
    } catch (error: any) {
      console.error('Error generating questions from PDF text:', error);
      toast({ title: 'Erro ao Gerar Questões', description: error.message || 'Ocorreu um erro inesperado. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answerIndex: number | null) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleCheckAnswer = (question: IQGeneratedQuestion) => {
    const userAnswerIndex = userAnswers[question.id];
    if (userAnswerIndex === null || userAnswerIndex === undefined) {
      toast({ title: 'Selecione uma Resposta', description: 'Por favor, escolha uma opção antes de verificar.', variant: 'destructive'});
      return;
    }

    const isCorrect = userAnswerIndex === question.correctAnswerIndex;
    
    const answeredQuestion: IAnsweredQuestion = {
      ...question,
      legalTextContext: pdfText, // Use pdfText as context
      userAnswerIndex,
      isCorrect,
      timestamp: Date.now(),
    };
    addAnswerToHistory(answeredQuestion);

    setShowFeedback((prev) => ({ ...prev, [question.id]: true }));

    toast({
        title: isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta!',
        variant: isCorrect ? 'default' : 'destructive',
        description: isCorrect ? 'Parabéns!' : `A resposta correta era: ${question.options[question.correctAnswerIndex]}`,
    });
  };
  
  const handleReset = () => {
    setPdfText('');
    setNumQuestions(1);
    setQuestionStyle('cespe');
    setGeneratedQuestions([]);
    setUserAnswers({});
    setShowFeedback({});
    setIsLoading(false);
  };

  const isYoutubeLink = (link: string) => {
    try {
      const url = new URL(link);
      return url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com' || url.hostname === 'youtu.be';
    } catch (e) {
      return false;
    }
  };
  
  const generateAiHint = (description?: string): string => {
    if (!description) return "legal concept";
    return description.toLowerCase().split(/\s+/).slice(0, 2).join(' ') || "legal concept";
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileType className="text-primary" /> Gerador de Questões por PDF
          </CardTitle>
          <CardDescription>
            Copie o texto do seu arquivo PDF, cole abaixo, escolha o número e o estilo das questões, e a IA criará um quiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientOnly>
            <form onSubmit={handleGenerateQuestions} className="space-y-6">
              <div>
                <Label htmlFor="pdfText" className="text-base font-medium block mb-1">Texto do PDF</Label>
                <Textarea
                  id="pdfText"
                  placeholder="Cole aqui o texto copiado do seu arquivo PDF..."
                  value={pdfText}
                  onChange={(e) => setPdfText(e.target.value)}
                  className="text-base min-h-[200px] resize-y"
                  disabled={isLoading}
                  rows={10}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numQuestions" className="text-base font-medium block mb-1">Número de Questões</Label>
                  <Select
                    value={numQuestions.toString()}
                    onValueChange={(value) => setNumQuestions(parseInt(value))}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="numQuestions" className="text-base">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 10].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} questão(ões)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="questionStyle" className="text-base font-medium block mb-1">Estilo da Questão</Label>
                  <Select
                    value={questionStyle}
                    onValueChange={(value) => setQuestionStyle(value as QuestionStyle)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="questionStyle" className="text-base">
                      <SelectValue placeholder="Selecione o estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cespe">Certo/Errado (Cespe)</SelectItem>
                      <SelectItem value="mcq4">Múltipla Escolha (A-D)</SelectItem>
                      <SelectItem value="mcq5">Múltipla Escolha (A-E)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button type="submit" disabled={isLoading || !pdfText.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Gerar Questões do PDF
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading} className="w-full sm:w-auto">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpar Tudo
                </Button>
              </div>
            </form>
          </ClientOnly>
        </CardContent>
      </Card>

      {isLoading && generatedQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 space-y-3">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Gerando suas questões a partir do texto do PDF... Isso pode levar alguns instantes.</p>
        </div>
      )}

      {generatedQuestions.length > 0 && !isLoading && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="text-primary"/> Questões Geradas do PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedQuestions.map((q, index) => (
              <Card key={q.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg">Questão {index + 1}</CardTitle>
                  <p className="text-foreground whitespace-pre-wrap pt-2">{q.question}</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <RadioGroup
                    value={userAnswers[q.id]?.toString()}
                    onValueChange={(val) => handleAnswerChange(q.id, parseInt(val))}
                    disabled={showFeedback[q.id]}
                  >
                    {q.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={optIndex.toString()} id={`${q.id}-opt${optIndex}`} />
                        <Label htmlFor={`${q.id}-opt${optIndex}`} className="font-normal">
                            {q.questionStyle !== 'cespe' ? String.fromCharCode(65 + optIndex) + ') ' : ''}
                            {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {!showFeedback[q.id] && (
                    <Button onClick={() => handleCheckAnswer(q)} size="sm">
                      <CheckCircle className="mr-2 h-4 w-4" /> Verificar Resposta
                    </Button>
                  )}

                  {showFeedback[q.id] && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="details">
                        <AccordionTrigger className="text-base hover:no-underline">
                            {userAnswers[q.id] === q.correctAnswerIndex ? (
                                <span className="flex items-center text-green-600"><CheckCircle className="mr-2"/> Resposta Correta! Ver Detalhes</span>
                            ) : (
                                <span className="flex items-center text-red-600"><XCircle className="mr-2"/> Resposta Incorreta. Ver Detalhes</span>
                            )}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          <div>
                            <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><Info className="text-primary h-5 w-5"/> Gabarito e Explicação</h4>
                            <p className="text-sm mb-1"><strong>Sua resposta:</strong> {q.options[userAnswers[q.id]!]}</p>
                            <p className="text-sm mb-1"><strong>Resposta correta:</strong> {q.options[q.correctAnswerIndex]}</p>
                            <Alert variant="default" className="bg-muted/50">
                                <AlertDescription className="whitespace-pre-wrap text-sm">{q.explanation}</AlertDescription>
                            </Alert>
                          </div>
                          
                          {q.aiGeneratedMnemonics && q.aiGeneratedMnemonics.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><Lightbulb className="text-primary h-5 w-5"/> Macetes (Gerados por IA)</h4>
                              <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-5 text-sm">
                                {q.aiGeneratedMnemonics.map((mnemonic, idx) => (
                                  <li key={`ai-mne-${q.id}-${idx}`}>{mnemonic}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {q.simulatedSourcedMnemonic && (
                              <div>
                                  <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><Lightbulb className="text-orange-500 h-5 w-5"/> Exemplo de Macete (Simulado de Fontes)</h4>
                                  <p className="text-muted-foreground italic text-sm">"{q.simulatedSourcedMnemonic}"</p>
                              </div>
                          )}
                          
                          {q.simulatedSourcedImageUrl && q.simulatedSourcedImageDescription && (
                              <div>
                                  <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><ImageIconLucide className="text-orange-400 h-5 w-5"/> Imagem (Simulada de Fontes)</h4>
                                  <p className="text-sm text-muted-foreground mb-1 italic">"{q.simulatedSourcedImageDescription}"</p>
                                  <div className="flex justify-center items-center p-2 border rounded-md bg-muted/30 max-w-xs mx-auto">
                                      <Image 
                                          src={q.simulatedSourcedImageUrl} 
                                          alt={q.simulatedSourcedImageDescription || "Imagem relacionada"} 
                                          width={200} 
                                          height={150}
                                          className="rounded-md object-cover"
                                          data-ai-hint={generateAiHint(q.simulatedSourcedImageDescription)}
                                      />
                                  </div>
                              </div>
                          )}
                          
                          {q.externalSearchLinks && q.externalSearchLinks.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><LinkIcon className="text-primary h-5 w-5"/> Links Úteis (Pesquisa Simulada)</h4>
                              <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-5 text-sm">
                                {q.externalSearchLinks.map((link, idx) => (
                                  <li key={`ext-link-${q.id}-${idx}`} className="flex items-center gap-1">
                                    {isYoutubeLink(link) && <Youtube className="h-4 w-4 text-red-600" />}
                                    <a href={link.startsWith('http') ? link : `http://${link}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate" title={link}>
                                      {link.length > 50 ? `${link.substring(0, 50)}...` : link}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
           <CardFooter>
            <Button onClick={handleReset} variant="outline">
              <FileQuestionIcon className="mr-2 h-4 w-4" /> Gerar Novas Questões
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

    