
'use client';

import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox'; // Added Checkbox
import { useToast } from '@/hooks/use-toast';
import { generateQuestions } from '@/ai/flows/generate-questions';
import type { IQGeneratedQuestion, QuestionStyle, IAnsweredQuestion } from '@/types';
import { addAnswerToHistory } from '@/lib/localStorage';
import { Loader2, Lightbulb, Link as LinkIcon, Info, FileText, Send, MessageCircleQuestion, Edit3, Settings2, ImageIcon as ImageIconLucide, RotateCcw, CheckCircle, XCircle, ListChecks, FileQuestion as FileQuestionIcon, Youtube, BookOpen, Tag, SearchCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClientOnly } from '@/components/ClientOnly';
import { Badge } from '@/components/ui/badge';


export default function HomePage() {
  const [legalText, setLegalText] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(1);
  const [questionStyle, setQuestionStyle] = useState<QuestionStyle>('cespe');
  const [fetchSimulatedExternal, setFetchSimulatedExternal] = useState<boolean>(false); // New state
  const [generatedQuestions, setGeneratedQuestions] = useState<IQGeneratedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  const handleGenerateQuestions = async (event: FormEvent) => {
    event.preventDefault();
    if (!legalText.trim()) {
      toast({ title: 'Texto Legal Ausente', description: 'Por favor, insira o texto legal para gerar questões.', variant: 'destructive' });
      return;
    }
    if (!subject.trim()) {
      toast({ title: 'Matéria Ausente', description: 'Por favor, insira o nome da matéria.', variant: 'destructive' });
      return;
    }
     if (!topic.trim()) {
      toast({ title: 'Tópico Ausente', description: 'Por favor, insira o tópico da matéria.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setGeneratedQuestions([]);
    setUserAnswers({});
    setShowFeedback({});

    try {
      const result = await generateQuestions({
        legalText,
        numQuestions,
        questionStyle,
        subject,
        topic,
        fetchSimulatedExternal, 
        numSimulatedExternal: fetchSimulatedExternal ? 2 : 0, 
      });
      
      setGeneratedQuestions(result.questions);

      toast({ title: 'Questões Geradas!', description: `${result.questions.length} questões foram criadas com sucesso.` });
    } catch (error: any) {
      console.error('Error generating questions:', error);
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
      legalTextContext: legalText, 
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
    setLegalText('');
    setSubject('');
    setTopic('');
    setNumQuestions(1);
    setQuestionStyle('cespe');
    setFetchSimulatedExternal(false);
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
    const defaultHint = "legal"; 
    if (!description || description.trim() === "" || /nenhuma imagem|não encontrada|não aplicável/i.test(description.toLowerCase())) {
        return defaultHint;
    }
    const words = description.toLowerCase().match(/[a-zA-Z0-9À-ÖØ-öø-ÿ]{3,}/g) || [];
    return words.slice(0, 2).join(' ') || defaultHint;
  };
  
  const noImageResponseRegex = /nenhuma imagem|não encontrada|não aplicável/i;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Edit3 className="text-primary" /> Gerador de Questões Jurídicas
          </CardTitle>
          <CardDescription>
            Insira a matéria, o tópico, um trecho de lei, e a IA criará um quiz com explicações, macetes e mais. Você também pode solicitar questões simuladas de bancas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientOnly>
            <form onSubmit={handleGenerateQuestions} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject" className="text-base font-medium block mb-1">Matéria</Label>
                  <Input 
                    id="subject" 
                    placeholder="Ex: Direito Constitucional" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    disabled={isLoading}
                    className="text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="topic" className="text-base font-medium block mb-1">Tópico</Label>
                  <Input 
                    id="topic" 
                    placeholder="Ex: Artigo 5º" 
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)} 
                    disabled={isLoading}
                    className="text-base"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="legalText" className="text-base font-medium block mb-1">Texto Legal</Label>
                <Textarea
                  id="legalText"
                  placeholder="Cole aqui o trecho da lei..."
                  value={legalText}
                  onChange={(e) => setLegalText(e.target.value)}
                  className="text-base min-h-[150px] resize-y"
                  disabled={isLoading}
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="numQuestions" className="text-base font-medium block mb-1">Nº Questões Inéditas</Label>
                  <Select
                    value={numQuestions.toString()}
                    onValueChange={(value) => setNumQuestions(parseInt(value))}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="numQuestions" className="text-base">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => ( 
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
                 <div className="flex items-center space-x-2 pb-1">
                  <Checkbox
                    id="fetchSimulatedExternal"
                    checked={fetchSimulatedExternal}
                    onCheckedChange={(checked) => setFetchSimulatedExternal(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="fetchSimulatedExternal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Incluir Questões de Bancas (Simulado)?
                  </Label>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button type="submit" disabled={isLoading || !legalText.trim() || !subject.trim() || !topic.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Gerar Questões
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
            <p className="text-muted-foreground">Gerando suas questões... Isso pode levar alguns instantes.</p>
        </div>
      )}

      {generatedQuestions.length > 0 && !isLoading && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="text-primary"/> Questões Geradas
            </CardTitle>
            <CardDescription>
                Matéria: <span className="font-semibold text-foreground">{subject}</span> | Tópico: <span className="font-semibold text-foreground">{topic}</span>
            </CardDescription>
             <Alert variant="default" className="mt-2">
                <SearchCheck className="h-4 w-4" />
                <AlertTitle>Sobre Questões de Bancas</AlertTitle>
                <AlertDescription>
                  As questões marcadas como "Simulado: [Nome da Banca]" são geradas pela IA para se assemelharem a questões reais de concurso e servem para fins de estudo e prática. Elas não são retiradas de provas oficiais.
                </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedQuestions.map((q, index) => (
              <Card key={q.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg">Questão {index + 1}</CardTitle>
                    <Badge variant={q.source === "INÉDITA DANTASAI" ? "default" : "secondary"} className="whitespace-nowrap">
                      {q.source}
                    </Badge>
                  </div>
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
                    <Button onClick={() => handleCheckAnswer(q)} size="sm" disabled={userAnswers[q.id] === undefined || userAnswers[q.id] === null}>
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
                          
                          <div>
                            <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><ImageIconLucide className="text-orange-400 h-5 w-5"/> Imagem (Simulada de Fontes)</h4>
                            {q.simulatedSourcedImageUrl && q.simulatedSourcedImageDescription && !noImageResponseRegex.test(q.simulatedSourcedImageDescription) ? (
                                <>
                                    <p className="text-sm text-muted-foreground mb-1 italic">"{q.simulatedSourcedImageDescription}"</p>
                                    <div className="flex justify-center items-center p-2 border rounded-md bg-muted/30 max-w-xs mx-auto">
                                        <Image 
                                            src={q.simulatedSourcedImageUrl} 
                                            alt={q.simulatedSourcedImageDescription} 
                                            width={200} 
                                            height={150}
                                            className="rounded-md object-cover"
                                            data-ai-hint={generateAiHint(q.simulatedSourcedImageDescription)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center italic py-4">Imagem do assunto não encontrada.</p>
                            )}
                          </div>
                          
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
