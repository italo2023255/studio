
'use client';

import type { FormEvent, ChangeEvent } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox'; 
import { useToast } from '@/hooks/use-toast';
import { generateQuestions } from '@/ai/flows/generate-questions';
import type { IQGeneratedQuestion, QuestionStyle, IAnsweredQuestion, IExternalLink } from '@/types';
import { addAnswerToHistory } from '@/lib/localStorage';
import { Loader2, Lightbulb, Link as LinkIcon, Info, FileText, Send, MessageCircleQuestion, Edit3, Settings2, ImageIcon as ImageIconLucide, RotateCcw, CheckCircle, XCircle, ListChecks, FileQuestion as FileQuestionIcon, Youtube, Instagram, Facebook, FileType, UploadCloud, BookOpen, Tag, SearchCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClientOnly } from '@/components/ClientOnly';
import { Badge } from '@/components/ui/badge';


// Função heurística para verificar se o texto extraído é provavelmente lixo
function isLikelyGarbage(text: string): boolean {
  if (!text || text.length < 50) return false; // Muito curto para julgar ou vazio
  const replacementCharRegex = /\uFFFD/g;
  const spaceRegex = /\s/g;

  const replacementMatches = text.match(replacementCharRegex);
  const percentageReplacement = (replacementMatches ? replacementMatches.length : 0) / text.length;

  const spaceMatches = text.match(spaceRegex);
  const percentageSpaces = (spaceMatches ? spaceMatches.length : 0) / text.length;

  if (text.length > 200 && percentageSpaces < 0.05) return true;
  return percentageReplacement > 0.20;
}


export default function GenerateFromPdfPage() {
  const [pdfText, setPdfText] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(1);
  const [questionStyle, setQuestionStyle] = useState<QuestionStyle>('cespe');
  const [fetchSimulatedExternal, setFetchSimulatedExternal] = useState<boolean>(false); 
  const [generatedQuestions, setGeneratedQuestions] = useState<IQGeneratedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({ title: 'Arquivo Inválido', description: 'Por favor, selecione um arquivo PDF.', variant: 'destructive' });
        event.target.value = ''; 
        return;
      }
      setIsProcessingFile(true);
      setPdfText(''); 

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text && !isLikelyGarbage(text)) {
          setPdfText(text);
          toast({
            title: 'Texto do PDF Carregado (Tentativa)',
            description: 'O texto foi extraído. Verifique se está correto antes de gerar as questões. A extração automática pode não ser perfeita.',
            variant: 'default',
            duration: 7000,
          });
        } else {
          setPdfText('');
          toast({
            title: 'Falha na Extração Automática do PDF',
            description: 'Não foi possível extrair o texto do PDF automaticamente ou o conteúdo é incompreensível. Por favor, copie e cole o texto do seu PDF manualmente na área indicada.',
            variant: 'destructive', 
            duration: 10000,
          });
        }
        setIsProcessingFile(false);
        event.target.value = ''; 
      };
      reader.onerror = () => {
        setPdfText('');
        setIsProcessingFile(false);
        toast({
          title: 'Erro ao Ler Arquivo PDF',
          description: 'Ocorreu um erro ao tentar ler o arquivo. Por favor, copie e cole o texto manualmente.',
          variant: 'destructive',
        });
        event.target.value = ''; 
      };
      reader.readAsText(file); 
    }
  };

  const handleGenerateQuestions = async (event: FormEvent) => {
    event.preventDefault();
    if (!pdfText.trim()) {
      toast({ title: 'Texto do PDF Ausente', description: 'Por favor, cole o texto do PDF ou faça upload de um arquivo para extração.', variant: 'destructive' });
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
        legalText: pdfText,
        numQuestions,
        questionStyle,
        subject,
        topic,
        fetchSimulatedExternal,
        numSimulatedExternal: fetchSimulatedExternal ? 2 : undefined,
      });
      
      setGeneratedQuestions(result.questions);

      toast({ title: 'Questões Geradas!', description: `${result.questions.length} questões foram criadas com sucesso a partir do texto fornecido.` });
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
      legalTextContext: pdfText,
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
    setSubject('');
    setTopic('');
    setNumQuestions(1);
    setQuestionStyle('cespe');
    setFetchSimulatedExternal(false);
    setGeneratedQuestions([]);
    setUserAnswers({});
    setShowFeedback({});
    setIsLoading(false);
    setIsProcessingFile(false);
    const fileInput = document.getElementById('pdfUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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

  const videoPlatforms: Array<{ type: IExternalLink['type']; name: string; icon: React.ElementType }> = [
    { type: 'youtube_video', name: 'YouTube', icon: Youtube },
    { type: 'instagram_video', name: 'Instagram', icon: Instagram },
    { type: 'facebook_video', name: 'Facebook', icon: Facebook },
  ];


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileType className="text-primary" /> Gerador de Questões por PDF
          </CardTitle>
          <CardDescription>
            Insira a matéria, o tópico, faça upload de um PDF para extração de texto (experimental), ou cole o texto do PDF abaixo. Depois, escolha o número e o estilo das questões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientOnly>
            <form onSubmit={handleGenerateQuestions} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pdfSubject" className="text-base font-medium block mb-1">Matéria</Label>
                  <Input 
                    id="pdfSubject" 
                    placeholder="Ex: Direito Penal" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    disabled={isLoading || isProcessingFile}
                    className="text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="pdfTopic" className="text-base font-medium block mb-1">Tópico</Label>
                  <Input 
                    id="pdfTopic" 
                    placeholder="Ex: Dos Crimes Contra a Vida" 
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)} 
                    disabled={isLoading || isProcessingFile}
                    className="text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfUpload" className="text-base font-medium">Upload de Arquivo PDF (Experimental)</Label>
                <Input
                  id="pdfUpload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isProcessingFile || isLoading}
                  className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {isProcessingFile && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando arquivo...</p>}
                 <Alert variant="default" className="mt-2">
                  <UploadCloud className="h-4 w-4" />
                  <AlertTitle>Nota sobre Upload de PDF</AlertTitle>
                  <AlertDescription>
                    A extração de texto de PDFs é complexa. Esta funcionalidade tentará ler o texto do seu PDF, mas pode não funcionar para todos os arquivos, especialmente os digitalizados como imagem ou com formatação complexa. Se a extração falhar, por favor, copie e cole o texto manualmente na área abaixo.
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              <div>
                <Label htmlFor="pdfText" className="text-base font-medium block mb-1">Texto do PDF (Copie e Cole aqui se o upload falhar)</Label>
                <Textarea
                  id="pdfText"
                  placeholder="Cole aqui o texto copiado do seu arquivo PDF..."
                  value={pdfText}
                  onChange={(e) => setPdfText(e.target.value)}
                  className="text-base min-h-[200px] resize-y"
                  disabled={isLoading || isProcessingFile}
                  rows={10}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="numQuestionsPdf" className="text-base font-medium block mb-1">Nº Questões Inéditas</Label>
                  <Select
                    value={numQuestions.toString()}
                    onValueChange={(value) => setNumQuestions(parseInt(value))}
                    disabled={isLoading || isProcessingFile}
                  >
                    <SelectTrigger id="numQuestionsPdf" className="text-base">
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
                  <Label htmlFor="questionStylePdf" className="text-base font-medium block mb-1">Estilo da Questão</Label>
                  <Select
                    value={questionStyle}
                    onValueChange={(value) => setQuestionStyle(value as QuestionStyle)}
                    disabled={isLoading || isProcessingFile}
                  >
                    <SelectTrigger id="questionStylePdf" className="text-base">
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
                    id="fetchSimulatedExternalPdf"
                    checked={fetchSimulatedExternal}
                    onCheckedChange={(checked) => setFetchSimulatedExternal(checked as boolean)}
                    disabled={isLoading || isProcessingFile}
                  />
                  <Label htmlFor="fetchSimulatedExternalPdf" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Questões de Bancas (Semelhantes)?
                  </Label>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button type="submit" disabled={isLoading || isProcessingFile || !pdfText.trim() || !subject.trim() || !topic.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Gerar Questões do Texto
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading || isProcessingFile} className="w-full sm:w-auto">
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
            <p className="text-muted-foreground">Gerando suas questões a partir do texto fornecido... Isso pode levar alguns instantes.</p>
        </div>
      )}

      {generatedQuestions.length > 0 && !isLoading && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="text-primary"/> Questões Geradas do Texto Fornecido
            </CardTitle>
             <CardDescription>
                Matéria: <span className="font-semibold text-foreground">{subject}</span> | Tópico: <span className="font-semibold text-foreground">{topic}</span>
            </CardDescription>
            <Alert variant="default" className="mt-2">
                <SearchCheck className="h-4 w-4" />
                <AlertTitle>Sobre Questões de Bancas</AlertTitle>
                <AlertDescription>
                  As questões marcadas como "Semelhante: [Nome da Banca]" são geradas pela IA para se assemelharem a questões reais de concurso e servem para fins de estudo e prática. Elas não são retiradas de provas oficiais.
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
                                  <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><Lightbulb className="text-orange-500 h-5 w-5"/> Exemplo de Macete (Semelhante de Fontes)</h4>
                                  <p className="text-muted-foreground italic text-sm">"{q.simulatedSourcedMnemonic}"</p>
                              </div>
                          )}
                          
                          <div>
                            <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><ImageIconLucide className="text-orange-400 h-5 w-5"/> Imagem (Semelhante de Fontes)</h4>
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
                          
                          {(q.externalSearchLinks && q.externalSearchLinks.length > 0) || videoPlatforms.some(vp => q.externalSearchLinks?.some(link => link.type === vp.type)) ? (
                            <div>
                              <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><LinkIcon className="text-primary h-5 w-5"/> Links Úteis (Pesquisa Semelhante)</h4>
                              <ul className="list-disc list-inside space-y-1 pl-5 text-sm">
                                {videoPlatforms.map(platform => {
                                  const platformLinks = q.externalSearchLinks?.filter(link => link.type === platform.type);
                                  if (platformLinks && platformLinks.length > 0) {
                                    return platformLinks.map((link, idx) => (
                                      <li key={`vid-link-${platform.type}-${q.id}-${idx}`} className="flex items-center gap-1">
                                        <platform.icon className="h-4 w-4 text-accent" />
                                        <a href={link.link.startsWith('http') ? link.link : `http://${link.link}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate" title={link.link}>
                                          {link.title || link.link}
                                        </a>
                                      </li>
                                    ));
                                  }
                                  return (
                                    <li key={`vid-link-nf-${platform.type}-${q.id}`} className="flex items-center gap-1 text-muted-foreground">
                                      <platform.icon className="h-4 w-4" /> {platform.name}: Não encontrado
                                    </li>
                                  );
                                })}
                                {q.externalSearchLinks?.filter(link => !videoPlatforms.some(vp => vp.type === link.type)).map((link, idx) => (
                                  <li key={`other-link-${q.id}-${idx}`} className="flex items-center gap-1">
                                    <LinkIcon className="h-4 w-4 text-accent" />
                                    <a href={link.link.startsWith('http') ? link.link : `http://${link.link}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate" title={link.link}>
                                      {link.title || link.link}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div>
                                <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><LinkIcon className="text-primary h-5 w-5"/> Links Úteis (Pesquisa Semelhante)</h4>
                                {videoPlatforms.map(platform => (
                                    <p key={`vid-link-nf-all-${platform.type}-${q.id}`} className="flex items-center gap-1 text-sm text-muted-foreground pl-5">
                                      <platform.icon className="h-4 w-4" /> {platform.name}: Não encontrado
                                    </p>
                                ))}
                                <p className="text-sm text-muted-foreground pl-5">Outros links: Não encontrados</p>
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
    
