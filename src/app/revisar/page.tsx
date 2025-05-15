
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getHistory, saveHistory } from '@/lib/localStorage';
import type { IAnsweredQuestion } from '@/types';
import { HistoryDetailsDialog } from '@/components/lexquiz/HistoryDetailsDialog';
import { Eye, ListChecks, Trash2, RefreshCwSquare, CheckCircle, XCircle, Filter, BookOpen, Tag, AlertTriangle, Repeat, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ClientOnly } from '@/components/ClientOnly';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent as ReviewDialogContent,
  DialogHeader as ReviewDialogHeader,
  DialogTitle as ReviewDialogTitle,
  DialogDescription as ReviewDialogDescription,
  DialogFooter as ReviewDialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert } from '@/components/ui/alert';
import Image from 'next/image';

const ALL_ITEMS_VALUE = "_all_";

export default function ReviewPage() {
  const [fullHistory, setFullHistory] = useState<IAnsweredQuestion[]>([]);
  const [questionToReview, setQuestionToReview] = useState<IAnsweredQuestion | null>(null);
  const [userReviewAnswer, setUserReviewAnswer] = useState<number | null>(null);
  const [showReviewFeedback, setShowReviewFeedback] = useState<boolean>(false);
  
  const [selectedQuestionDetails, setSelectedQuestionDetails] = useState<IAnsweredQuestion | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [filterOnlyMistakes, setFilterOnlyMistakes] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setFullHistory(getHistory());
  }, []);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(fullHistory.map(item => item.subject).filter(Boolean) as string[]);
    return Array.from(subjects).sort();
  }, [fullHistory]);

  const uniqueTopics = useMemo(() => {
    const topics = new Set(
      fullHistory
        .filter(item => !filterSubject || item.subject === filterSubject)
        .map(item => item.topic)
        .filter(Boolean) as string[]
    );
    return Array.from(topics).sort();
  }, [fullHistory, filterSubject]);

  const filteredHistory = useMemo(() => {
    return fullHistory.filter(item => {
      const subjectMatch = !filterSubject || item.subject === filterSubject;
      const topicMatch = !filterTopic || item.topic === filterTopic;
      const mistakesMatch = !filterOnlyMistakes || (item.isCorrect === false && item.userAnswerIndex !== null); // only actual mistakes
      return subjectMatch && topicMatch && mistakesMatch;
    }).sort((a,b) => b.timestamp - a.timestamp); // Sort by most recent first
  }, [fullHistory, filterSubject, filterTopic, filterOnlyMistakes]);

  const handleDeleteQuestion = (questionId: string) => {
    const updatedHistory = fullHistory.filter(q => q.id !== questionId);
    saveHistory(updatedHistory);
    setFullHistory(updatedHistory);
    toast({ title: "Questão Removida", description: "A questão foi removida do seu histórico." });
  };
  
  const handleViewDetails = (question: IAnsweredQuestion) => {
    setSelectedQuestionDetails(question);
  };

  const handleOpenReviewDialog = (question: IAnsweredQuestion) => {
    setQuestionToReview(question);
    setUserReviewAnswer(null);
    setShowReviewFeedback(false);
  };

  const handleCheckReviewAnswer = () => {
    if (userReviewAnswer === null || questionToReview === null) return;
    setShowReviewFeedback(true);
    // Note: This does not update the original history record.
  };

  const resetFilters = () => {
    setFilterSubject('');
    setFilterTopic('');
    setFilterOnlyMistakes(false);
  };

  const getQuestionStyleLabel = (style: IAnsweredQuestion['questionStyle']) => {
    if (style === 'cespe') return 'Certo/Errado';
    if (style === 'mcq4') return 'Múltipla Escolha (4)';
    if (style === 'mcq5') return 'Múltipla Escolha (5)';
    return 'Desconhecido';
  };

  const generateAiHint = (description?: string): string => {
    if (!description) return "legal concept";
    return description.toLowerCase().split(/\s+/).slice(0, 2).join(' ') || "legal concept";
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCwSquare className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-4 text-xl text-muted-foreground">Carregando questões para revisão...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <RefreshCwSquare className="text-primary" /> Revisar Questões
          </CardTitle>
          <CardDescription>Filtre suas questões salvas, revise seus erros e reforce seu aprendizado.</CardDescription>
        </CardHeader>
        <CardContent>
         <ClientOnly>
          {fullHistory.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="filterSubjectReview" className="text-sm font-medium">Matéria</Label>
                  <Select 
                    value={filterSubject === '' ? ALL_ITEMS_VALUE : filterSubject} 
                    onValueChange={(value) => setFilterSubject(value === ALL_ITEMS_VALUE ? '' : value)}
                  >
                    <SelectTrigger id="filterSubjectReview">
                      <SelectValue placeholder="Todas as Matérias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ITEMS_VALUE}>Todas as Matérias</SelectItem>
                      {uniqueSubjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterTopicReview" className="text-sm font-medium">Tópico</Label>
                  <Select 
                    value={filterTopic === '' ? ALL_ITEMS_VALUE : filterTopic} 
                    onValueChange={(value) => setFilterTopic(value === ALL_ITEMS_VALUE ? '' : value)} 
                    disabled={!uniqueTopics.length && !filterSubject}
                  >
                    <SelectTrigger id="filterTopicReview">
                      <SelectValue placeholder="Todos os Tópicos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ITEMS_VALUE}>Todos os Tópicos</SelectItem>
                      {uniqueTopics.map(topic => (
                        <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-5 sm:pt-0">
                  <Checkbox
                    id="filterOnlyMistakes"
                    checked={filterOnlyMistakes}
                    onCheckedChange={(checked) => setFilterOnlyMistakes(checked as boolean)}
                  />
                  <Label htmlFor="filterOnlyMistakes" className="font-medium">Mostrar apenas erros</Label>
                </div>
              </div>
              <Button onClick={resetFilters} variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Limpar Filtros
              </Button>
            </div>
          )}

          {filteredHistory.length === 0 ? (
            <div className="text-center py-10">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg text-muted-foreground">
                {fullHistory.length === 0 ? "Nenhuma questão no histórico para revisar." : "Nenhuma questão encontrada para os filtros selecionados."}
              </p>
              <p className="text-sm text-muted-foreground">
                {fullHistory.length === 0 ? "Responda algumas questões para vê-las aqui." : "Tente ajustar os filtros."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(60vh-50px)] sm:h-[calc(70vh-120px)]"> {/* Adjusted height */}
              <div className="space-y-4 pr-4">
                {filteredHistory.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg truncate flex-1 mr-2" title={item.question}>
                          {item.question}
                        </CardTitle>
                        {item.userAnswerIndex !== null && item.isCorrect !== null && (
                            item.isCorrect ? 
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="mr-1 h-4 w-4"/>Correta</Badge> : 
                            <Badge variant="destructive"><XCircle className="mr-1 h-4 w-4"/>Incorreta</Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs flex flex-wrap gap-x-2 gap-y-1 mt-1">
                        <span>Respondido em: {new Date(item.timestamp).toLocaleString('pt-BR')}</span>
                        <span className="hidden sm:inline">|</span>
                        <span>Estilo: {getQuestionStyleLabel(item.questionStyle)}</span>
                        {item.subject && <><span className="hidden sm:inline">|</span><span className="flex items-center gap-1"><BookOpen className="h-3 w-3"/> {item.subject}</span></>}
                        {item.topic && <><span className="hidden sm:inline">|</span><span className="flex items-center gap-1"><Tag className="h-3 w-3"/> {item.topic}</span></>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground line-clamp-2">
                        Sua Resposta: <span className="font-medium text-foreground">{item.userAnswerIndex !== null && item.options[item.userAnswerIndex] ? item.options[item.userAnswerIndex] : "Não respondida"}</span>
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenReviewDialog(item)}>
                        <Repeat className="mr-2 h-4 w-4" /> Refazer
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(item)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDesc>
                              Tem certeza que deseja remover esta questão do seu histórico? Esta ação não pode ser desfeita.
                            </AlertDialogDesc>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteQuestion(item.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
          </ClientOnly>
        </CardContent>
      </Card>

      {selectedQuestionDetails && (
        <HistoryDetailsDialog
          isOpen={!!selectedQuestionDetails}
          onClose={() => setSelectedQuestionDetails(null)}
          answeredQuestion={selectedQuestionDetails}
        />
      )}

      {questionToReview && (
        <Dialog open={!!questionToReview} onOpenChange={() => { setQuestionToReview(null); setShowReviewFeedback(false); setUserReviewAnswer(null); }}>
          <ReviewDialogContent className="sm:max-w-2xl">
            <ReviewDialogHeader>
              <ReviewDialogTitle className="flex items-center gap-2"><Repeat className="text-primary"/> Refazer Questão</ReviewDialogTitle>
              <ReviewDialogDescription>
                Matéria: {questionToReview.subject || 'N/A'} | Tópico: {questionToReview.topic || 'N/A'}
              </ReviewDialogDescription>
            </ReviewDialogHeader>
            <ScrollArea className="max-h-[70vh] p-1 pr-3">
            <div className="space-y-4 py-4">
              <p className="text-foreground whitespace-pre-wrap text-base">{questionToReview.question}</p>
              <RadioGroup
                value={userReviewAnswer?.toString()}
                onValueChange={(val) => setUserReviewAnswer(parseInt(val))}
                disabled={showReviewFeedback}
                className="space-y-2"
              >
                {questionToReview.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary">
                    <RadioGroupItem value={optIndex.toString()} id={`review-${questionToReview.id}-opt${optIndex}`} />
                    <Label htmlFor={`review-${questionToReview.id}-opt${optIndex}`} className="font-normal cursor-pointer flex-1">
                        {questionToReview.questionStyle !== 'cespe' ? String.fromCharCode(65 + optIndex) + ') ' : ''}
                        {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {!showReviewFeedback && (
                <Button onClick={handleCheckReviewAnswer} disabled={userReviewAnswer === null}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Verificar Resposta
                </Button>
              )}

              {showReviewFeedback && questionToReview && (
                <div className="space-y-4 pt-4 border-t mt-4">
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                    {userReviewAnswer === questionToReview.correctAnswerIndex ? (
                        <span className="flex items-center text-green-600"><CheckCircle className="mr-2"/> Resposta Correta!</span>
                    ) : (
                        <span className="flex items-center text-red-600"><XCircle className="mr-2"/> Resposta Incorreta.</span>
                    )}
                  </h3>
                  <p className="text-sm"><strong>Sua nova resposta:</strong> {questionToReview.options[userReviewAnswer!]}</p>
                  <p className="text-sm"><strong>Resposta correta:</strong> {questionToReview.options[questionToReview.correctAnswerIndex]}</p>
                  <Alert variant="default" className="bg-muted/50">
                    <Info className="h-4 w-4" />
                    <ReviewDialogDescription className="whitespace-pre-wrap text-sm">{questionToReview.explanation}</ReviewDialogDescription>
                  </Alert>
                  {questionToReview.simulatedSourcedImageUrl && questionToReview.simulatedSourcedImageDescription && (
                    <div>
                        <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><ImageIconLucide className="text-orange-400 h-5 w-5"/> Imagem (Simulada de Fontes)</h4>
                        <p className="text-sm text-muted-foreground mb-1 italic">"{questionToReview.simulatedSourcedImageDescription}"</p>
                        <div className="flex justify-center items-center p-2 border rounded-md bg-muted/30 max-w-xs mx-auto">
                            <Image 
                                src={questionToReview.simulatedSourcedImageUrl} 
                                alt={questionToReview.simulatedSourcedImageDescription || "Imagem relacionada"} 
                                width={200} 
                                height={150}
                                className="rounded-md object-cover"
                                data-ai-hint={generateAiHint(questionToReview.simulatedSourcedImageDescription)}
                            />
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </ScrollArea>
            <ReviewDialogFooter>
               <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
            </ReviewDialogFooter>
          </ReviewDialogContent>
        </Dialog>
      )}

    </div>
  );
}
