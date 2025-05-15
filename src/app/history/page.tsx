
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getHistory, saveHistory } from '@/lib/localStorage'; // Uses IAnsweredQuestion
import type { IAnsweredQuestion } from '@/types';
import { HistoryDetailsDialog } from '@/components/lexquiz/HistoryDetailsDialog';
import { Eye, ListChecks, Trash2, FileQuestion as FileQuestionIcon, CheckCircle, XCircle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function HistoryPage() {
  const [history, setHistory] = useState<IAnsweredQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<IAnsweredQuestion | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setHistory(getHistory());
  }, []);

  const handleViewDetails = (question: IAnsweredQuestion) => {
    setSelectedQuestion(question);
  };

  const handleClearHistory = () => {
    saveHistory([]); // Clears IAnsweredQuestion history
    setHistory([]);
    toast({ title: "Histórico Limpo", description: "Seu histórico de questões respondidas foi removido." });
  };

  const getQuestionStyleLabel = (style: IAnsweredQuestion['questionStyle']) => {
    if (style === 'cespe') return 'Certo/Errado';
    if (style === 'mcq4') return 'Múltipla Escolha (4)';
    if (style === 'mcq5') return 'Múltipla Escolha (5)';
    return 'Desconhecido';
  };

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
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ListChecks className="text-primary" /> Histórico de Questões
            </CardTitle>
            <CardDescription>Revise as questões que você respondeu e seus resultados.</CardDescription>
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
          {history.length === 0 ? (
            <div className="text-center py-10">
              <FileQuestionIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg text-muted-foreground">Seu histórico está vazio.</p>
              <p className="text-sm text-muted-foreground">Responda algumas questões para vê-las aqui.</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {history.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg truncate flex-1 mr-2" title={item.question}>
                          {item.question}
                        </CardTitle>
                        {item.isCorrect !== null && (
                            item.isCorrect ? 
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="mr-1 h-4 w-4"/>Correta</Badge> : 
                            <Badge variant="destructive"><XCircle className="mr-1 h-4 w-4"/>Incorreta</Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        Respondido em: {new Date(item.timestamp).toLocaleString('pt-BR')}
                         <span className="mx-1">|</span> Estilo: {getQuestionStyleLabel(item.questionStyle)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground line-clamp-2">
                        Sua Resposta: <span className="font-medium text-foreground">{item.userAnswerIndex !== null ? item.options[item.userAnswerIndex] : "Não respondida"}</span>
                      </p>
                       <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                        Explicação: <span className="font-normal text-foreground">{item.explanation.substring(0,150)}{item.explanation.length > 150 ? "..." : ""}</span>
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
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
