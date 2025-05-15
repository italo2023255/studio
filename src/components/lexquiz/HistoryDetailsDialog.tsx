
'use client';

import type { ILegalAnswer } from '@/types'; // Changed to ILegalAnswer
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Lightbulb, Link as LinkIcon, Info, FileText, Image as ImageIcon, MessageCircle } from 'lucide-react';
import NextImage from 'next/image'; // Using NextImage for consistency

interface HistoryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  legalAnswer: ILegalAnswer | null; // Changed prop name and type
}

export function HistoryDetailsDialog({ isOpen, onClose, legalAnswer }: HistoryDetailsDialogProps) {
  if (!legalAnswer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
             <MessageCircle className="text-primary h-6 w-6" /> Detalhes da Consulta
          </DialogTitle>
          <DialogDescription>
            Revisão da consulta feita em {new Date(legalAnswer.timestamp).toLocaleString('pt-BR')}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(80vh-150px)] pr-6">
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Sua Pergunta:</h3>
              <p className="text-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                {legalAnswer.userQuestion}
              </p>
            </div>
            <Separator/>
            <div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><FileText className="text-primary"/> Artigo de Lei Citado:</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                {legalAnswer.citedArticle}
              </p>
            </div>
            <Separator/>
            <div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Info className="text-primary"/> Explicação Detalhada:</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {legalAnswer.enhancedExplanation || legalAnswer.explanation}
              </p>
            </div>

            {legalAnswer.aiGeneratedImageDataUri && (
              <>
                <Separator/>
                <div>
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><ImageIcon className="text-primary"/> Imagem Conceitual (Gerada por IA):</h3>
                   <div className="flex justify-center items-center p-2 border rounded-md bg-muted/30 my-2">
                        <NextImage 
                            src={legalAnswer.aiGeneratedImageDataUri} 
                            alt="Imagem conceitual gerada por IA" 
                            width={300} 
                            height={300} 
                            className="rounded-md object-contain"
                            data-ai-hint="legal concept abstract"
                        />
                    </div>
                </div>
              </>
            )}

            {legalAnswer.sourcedImageDescription && (
                <>
                <Separator/>
                <div>
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><ImageIcon className="text-orange-500"/> Exemplo de Imagem (Fontes Especializadas):</h3>
                    <p className="text-sm text-muted-foreground mb-2 italic">"{legalAnswer.sourcedImageDescription}"</p>
                    {legalAnswer.sourcedImageUrl && (
                        <div className="flex justify-center items-center p-2 border rounded-md bg-muted/30 my-2">
                            <NextImage 
                                src={legalAnswer.sourcedImageUrl} 
                                alt={legalAnswer.sourcedImageDescription || "Placeholder de imagem externa"}
                                width={300} 
                                height={200}
                                className="rounded-md object-cover"
                                data-ai-hint="legal illustration diagram"
                            />
                        </div>
                    )}
                </div>
                </>
            )}


            {legalAnswer.aiGeneratedMnemonics && legalAnswer.aiGeneratedMnemonics.length > 0 && (
              <>
                <Separator/>
                <div>
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Lightbulb className="text-primary"/> Macetes (Gerados por IA):</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {legalAnswer.aiGeneratedMnemonics.map((m, i) => <li key={`hist-ai-mne-${i}`}>{m}</li>)}
                  </ul>
                </div>
              </>
            )}

            {legalAnswer.sourcedMnemonic && (
                <>
                <Separator/>
                <div>
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Lightbulb className="text-orange-500"/> Exemplo de Macete (Fontes Especializadas):</h3>
                    <p className="text-muted-foreground italic">"{legalAnswer.sourcedMnemonic}"</p>
                </div>
                </>
            )}

            {legalAnswer.externalSearchLinks && legalAnswer.externalSearchLinks.length > 0 && (
               <>
                <Separator/>
                <div>
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><LinkIcon className="text-primary"/> Links Úteis:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {legalAnswer.externalSearchLinks.map((link, i) => (
                      <li key={`hist-ext-link-${i}`}><a href={link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{link}</a></li>
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
