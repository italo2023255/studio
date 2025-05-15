
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getHistory, saveHistory } from '@/lib/localStorage';
import type { IAnsweredQuestion } from '@/types';
import { HistoryDetailsDialog } from '@/components/lexquiz/HistoryDetailsDialog';
import { Eye, ListChecks, Trash2, FileQuestion as FileQuestionIcon, CheckCircle, XCircle, Filter, BookOpen, Tag } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ClientOnly } from '@/components/ClientOnly';

const ALL_ITEMS_VALUE = "_all_";

export default function HistoryPage() {
  const [history, setHistory] = useState<IAnsweredQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<IAnsweredQuestion | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterTopic, setFilterTopic] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setHistory(getHistory());
  }, []);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(history.map(item => item.subject).filter(Boolean) as string[]);
    return Array.from(subjects).sort();
  }, [history]);

  const uniqueTopics = useMemo(() => {
    const topics = new Set(
      history
        .filter(item => !filterSubject || item.subject === filterSubject)
        .map(item => item.topic)
        .filter(Boolean) as string[]
    );
    return Array.from(topics).sort();
  }, [history, filterSubject]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const subjectMatch = !filterSubject || item.subject === filterSubject;
      const topicMatch = !filterTopic || item.topic === filterTopic;
      return subjectMatch && topicMatch;
    }).sort((a,b) => b.timestamp - a.timestamp); // Sort by most recent first;
  }, [history, filterSubject, filterTopic]);

  const handleViewDetails = (question: IAnsweredQuestion) => {
    setSelectedQuestion(question);
  };

  const handleClearHistory = () => {
    saveHistory([]); 
    setHistory([]);
    setFilterSubject('');
    setFilterTopic('');
    toast({ title: "Histórico Limpo", description: "Seu histórico de questões respondidas foi removido." });
  };

  const getQuestionStyleLabel = (style?: IAnsweredQuestion['questionStyle']) => { // Made style optional for safety
    if (style === 'cespe') return 'Certo/Errado';
    if (style === 'mcq4') return 'Múltipla Escolha (4)';
    if (style === 'mcq5') return 'Múltipla Escolha (5)';
    return 'Desconhecido';
  };
  
  const resetFilters = () => {
    setFilterSubject('');
    setFilterTopic('');
  }

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <ListChecks className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-4 text-xl text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0">
            <CardTitle className="text-2xl flex items-center gap-2">
              <ListChecks className="text-primary" /> Histórico de Questões
            </CardTitle>
            <CardDescription>Revise as questões que você respondeu e seus resultados. Filtre por matéria ou tópico.</CardDescription>
          </div>
          {history.length > 0 && (
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Histórico
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Limpeza do Histórico</AlertDialogTitle>
                  <AlertDialogDesc>
                    Tem certeza que deseja apagar todo o seu histórico de questões? Esta ação não pode ser desfeita.
                  </AlertDialogDesc>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Limpar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
         <ClientOnly>
          {history.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="filterSubject" className="text-sm font-medium">Filtrar por Matéria</Label>
                  <Select 
                    value={filterSubject === '' ? ALL_ITEMS_VALUE : filterSubject} 
                    onValueChange={(value) => setFilterSubject(value === ALL_ITEMS_VALUE ? '' : value)}
                  >
                    <SelectTrigger id="filterSubject">
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
                  <Label htmlFor="filterTopic" className="text-sm font-medium">Filtrar por Tópico</Label>
                  <Select 
                    value={filterTopic === '' ? ALL_ITEMS_VALUE : filterTopic} 
                    onValueChange={(value) => setFilterTopic(value === ALL_ITEMS_VALUE ? '' : value)} 
                    disabled={!uniqueTopics.length && !filterSubject}
                  >
                    <SelectTrigger id="filterTopic">
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
                <Button onClick={resetFilters} variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> Limpar Filtros
                </Button>
              </div>
            </div>
          )}

          {filteredHistory.length === 0 ? (
            <div className="text-center py-10">
              <FileQuestionIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg text-muted-foreground">
                {history.length === 0 ? "Seu histórico está vazio." : "Nenhuma questão encontrada para os filtros selecionados."}
              </p>
              <p className="text-sm text-muted-foreground">
                {history.length === 0 ? "Responda algumas questões para vê-las aqui." : "Tente ajustar os filtros ou limpar para ver todas as questões."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(60vh-50px)] sm:h-[60vh]">
              <div className="space-y-4 pr-2 sm:pr-4"> {/* Adjusted pr for smaller screens */}
                {filteredHistory.map((item, index) => ( 
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg flex-1 min-w-0 break-words" title={item.question}>
                           Questão {filteredHistory.length - index}: {item.question} 
                        </CardTitle>
                        <div className="flex flex-col items-end gap-1">
                            {item.isCorrect !== null && (
                                item.isCorrect ? 
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="mr-1 h-4 w-4"/>Correta</Badge> : 
                                <Badge variant="destructive"><XCircle className="mr-1 h-4 w-4"/>Incorreta</Badge>
                            )}
                            <Badge variant={item.source === "INÉDITA DANTASAI" ? "default" : "secondary"} className="whitespace-nowrap text-xs">
                              {item.source}
                            </Badge>
                        </div>
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
                       <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                        Sua Resposta: <span className="font-medium text-foreground">{item.userAnswerIndex !== null && item.userAnswerIndex !== undefined && item.options[item.userAnswerIndex] ? item.options[item.userAnswerIndex] : "Não respondida"}</span>
                      </p>
                       <p className="text-sm text-muted-foreground line-clamp-3 break-words mt-1">
                        Explicação: <span className="font-normal text-foreground">{item.explanation.substring(0,150)}{item.explanation.length > 150 ? "..." : ""}</span>
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
          </ClientOnly>
        </CardContent>
      </Card>

      {selectedQuestion && (
        <HistoryDetailsDialog
          isOpen={!!selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          answeredQuestion={selectedQuestion}
        />
      )}
    </div>
  );
}
