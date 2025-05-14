'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getHistory } from '@/lib/localStorage';
import type { IAnsweredQuestion } from '@/types';
import { HistoryDetailsDialog } from '@/components/lexquiz/HistoryDetailsDialog';
import { CheckCircle2, XCircle, Eye, ListChecks, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc, // Renamed to avoid conflict
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { saveHistory } from '@/lib/localStorage';


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
    saveHistory([]);
    setHistory([]);
    toast({ title: "Histórico Limpo", description: "Seu histórico de questões foi removido." });
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
            <CardDescription>Revise as questões que você já respondeu.</CardDescription>
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
                  <AlertDialogDesc> {/* Used renamed component */}
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
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg text-muted-foreground">Seu histórico está vazio.</p>
              <p className="text-sm text-muted-foreground">Responda algumas questões para vê-las aqui.</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {history.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg truncate flex items-center justify-between">
                        <span className="truncate flex-1 mr-2" title={item.question}>{item.question}</span>
                        {item.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Respondida em: {new Date(item.timestamp).toLocaleString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Sua resposta: <span className="font-medium text-foreground">{item.options[item.userAnswerIndex]}</span>
                      </p>
                      {!item.isCorrect && (
                        <p className="text-sm text-muted-foreground">
                          Resposta correta: <span className="font-medium text-foreground">{item.options[item.correctAnswerIndex]}</span>
                        </p>
                      )}
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
          questionDetails={selectedQuestion}
        />
      )}
    </div>
  );
}
