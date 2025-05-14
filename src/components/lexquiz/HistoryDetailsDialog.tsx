'use client';

import type { IAnsweredQuestion } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Lightbulb, Link as LinkIcon, Info, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questionDetails: IAnsweredQuestion | null;
}

export function HistoryDetailsDialog({ isOpen, onClose, questionDetails }: HistoryDetailsDialogProps) {
  if (!questionDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
             <FileText className="text-primary h-6 w-6" /> Detalhes da Questão
          </DialogTitle>
          <DialogDescription>
            Revisão da questão respondida em {new Date(questionDetails.timestamp).toLocaleString('pt-BR')}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(80vh-150px)] pr-6"> {/* Adjusted max height */}
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Texto Legal Original (Contexto):</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap max-h-40 overflow-y-auto">
                {questionDetails.legalTextContext}
              </p>
            </div>
            <Separator/>
            <div>
              <h3 className="font-semibold text-lg mb-1">Questão:</h3>
              <p className="text-foreground whitespace-pre-wrap">{questionDetails.question}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Opções:</h3>
              <ul className="space-y-1">
                {questionDetails.options.map((option, index) => (
                  <li
                    key={index}
                    className={`text-sm p-2 rounded-md ${
                      index === questionDetails.correctAnswerIndex ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700' : ''
                    } ${
                      index === questionDetails.userAnswerIndex && index !== questionDetails.correctAnswerIndex ? 'bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700' : ''
                    }`}
                  >
                    {option}
                    {index === questionDetails.correctAnswerIndex && <Badge variant="outline" className="ml-2 border-green-600 text-green-700 dark:text-green-300 dark:border-green-500">Correta</Badge>}
                    {index === questionDetails.userAnswerIndex && <Badge variant="outline" className="ml-2">Sua Resposta</Badge>}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={`p-3 rounded-md ${questionDetails.isCorrect ? 'bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700'}`}>
                <div className={`flex items-center gap-2 font-semibold ${questionDetails.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {questionDetails.isCorrect ? <CheckCircle2/> : <XCircle/>}
                    {questionDetails.isCorrect ? 'Você acertou!' : 'Você errou.'}
                </div>
            </div>

            <Separator/>
            <div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Info className="text-primary"/> Explicação:</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {questionDetails.enhancedExplanation || questionDetails.explanation}
              </p>
            </div>

            {(questionDetails.mnemonic || (questionDetails.generatedMnemonics && questionDetails.generatedMnemonics.length > 0)) && (
              <>
                <Separator/>
                <div>
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Lightbulb className="text-primary"/> Dicas e Macetes:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {questionDetails.mnemonic && <li>{questionDetails.mnemonic}</li>}
                    {questionDetails.generatedMnemonics?.map((m, i) => <li key={`hist-mne-${i}`}>{m}</li>)}
                  </ul>
                </div>
              </>
            )}

            {(questionDetails.searchLinks || (questionDetails.additionalSearchLinks && questionDetails.additionalSearchLinks.length > 0)) && (
               <>
                <Separator/>
                <div>
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><LinkIcon className="text-primary"/> Links Úteis:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {questionDetails.searchLinks?.map((link, i) => (
                      <li key={`hist-sl-${i}`}><a href={link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{link}</a></li>
                    ))}
                    {questionDetails.additionalSearchLinks?.map((link, i) => (
                      <li key={`hist-asl-${i}`}><a href={link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{link}</a></li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
