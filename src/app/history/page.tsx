
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getHistory, saveHistory } from '@/lib/localStorage'; // Using new getHistory
import type { ILegalAnswer } from '@/types'; // Using new ILegalAnswer
import { HistoryDetailsDialog } from '@/components/lexquiz/HistoryDetailsDialog'; // This dialog will need to be updated
import { Eye, ListChecks, Trash2, FileQuestion } from 'lucide-react';
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

export default function HistoryPage() {
  const [history, setHistory] = useState<ILegalAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<ILegalAnswer | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setHistory(getHistory());
  }, []);

  const handleViewDetails = (answer: ILegalAnswer) => {
    setSelectedAnswer(answer);
  };

  const handleClearHistory = () => {
    saveHistory([]);
    setHistory([]);
    toast({ title: "Histórico Limpo", description: "Seu histórico de perguntas e respostas foi removido." });
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
              <ListChecks className="text-primary" /> Histórico de Consultas
            </CardTitle>
            <CardDescription>Revise as perguntas que você fez e as respostas da IA.</CardDescription>
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
                    Tem certeza que deseja apagar todo o seu histórico de consultas? Esta ação não pode ser desfeita.
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
              <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg text-muted-foreground">Seu histórico está vazio.</p>
              <p className="text-sm text-muted-foreground">Faça algumas perguntas para vê-las aqui.</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {history.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg truncate flex items-center justify-between">
                        <span className="truncate flex-1 mr-2" title={item.userQuestion}>
                          P: {item.userQuestion}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Consultado em: {new Date(item.timestamp).toLocaleString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground line-clamp-2">
                        Artigo Citado: <span className="font-medium text-foreground">{item.citedArticle.substring(0,100)}{item.citedArticle.length > 100 ? "..." : ""}</span>
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

      {selectedAnswer && (
        <HistoryDetailsDialog
          isOpen={!!selectedAnswer}
          onClose={() => setSelectedAnswer(null)}
          legalAnswer={selectedAnswer} // Prop name changed
        />
      )}
    </div>
  );
}
