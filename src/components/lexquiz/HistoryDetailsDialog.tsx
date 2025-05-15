
'use client';

import type { IAnsweredQuestion, IExternalLink } from '@/types';
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
import { Lightbulb, Link as LinkIcon, Info, FileText, Image as ImageIconLucide, MessageCircle, CheckCircle, XCircle, Youtube, Instagram, Facebook, BookOpen, Tag } from 'lucide-react';
import NextImage from 'next/image'; 
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';


interface HistoryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  answeredQuestion: IAnsweredQuestion | null;
}

export function HistoryDetailsDialog({ isOpen, onClose, answeredQuestion }: HistoryDetailsDialogProps) {
  if (!answeredQuestion) return null;

  const {
    question,
    options,
    correctAnswerIndex,
    explanation,
    questionStyle,
    subject, 
    topic,   
    source, 
    aiGeneratedMnemonics,
    externalSearchLinks,
    simulatedSourcedImageDescription,
    simulatedSourcedImageUrl,
    simulatedSourcedMnemonic,
    legalTextContext,
    userAnswerIndex,
    isCorrect,
    timestamp,
  } = answeredQuestion;

  const getQuestionStyleLabel = (style?: IAnsweredQuestion['questionStyle']) => {
    if (style === 'cespe') return 'Certo/Errado';
    if (style === 'mcq4') return 'Múltipla Escolha (4 opções)';
    if (style === 'mcq5') return 'Múltipla Escolha (5 opções)';
    return 'Desconhecido';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
             <MessageCircle className="text-primary h-6 w-6" /> Detalhes da Questão Respondida
          </DialogTitle>
          <DialogDescription className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-2 sm:gap-y-1 text-xs">
            <span>Respondido em {new Date(timestamp).toLocaleString('pt-BR')}.</span>
            {questionStyle && <span>Estilo: {getQuestionStyleLabel(questionStyle)}.</span>}
            {subject && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3"/> {subject}.</span>}
            {topic && <span className="flex items-center gap-1"><Tag className="h-3 w-3"/> {topic}.</span>}
            {source && <span className="font-semibold">Fonte: {source}.</span>}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(80vh-200px)] pr-6"> 
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Questão:</h3>
              <p className="text-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                {question}
              </p>
            </div>

            {isCorrect !== null && (
                <div className={`p-3 rounded-md flex items-center gap-2 ${isCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                    {isCorrect ? <CheckCircle className="text-green-600 dark:text-green-400 h-5 w-5"/> : <XCircle className="text-red-600 dark:text-red-400 h-5 w-5"/>}
                    <span className={`font-medium ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {isCorrect ? "Você acertou!" : "Você errou."}
                    </span>
                </div>
            )}

            {userAnswerIndex !== null && userAnswerIndex !== undefined && options[userAnswerIndex] && (
                 <div>
                    <h3 className="font-semibold text-md">Sua Resposta:</h3>
                    <p className="text-muted-foreground">{ (questionStyle !== 'cespe' ? String.fromCharCode(65 + userAnswerIndex) + '. ' : '') + options[userAnswerIndex]}</p>
                </div>
            )}
             {correctAnswerIndex !== null && correctAnswerIndex !== undefined && options[correctAnswerIndex] && (
                <div>
                    <h3 className="font-semibold text-md">Resposta Correta:</h3>
                    <p className="text-muted-foreground">{(questionStyle !== 'cespe' ? String.fromCharCode(65 + correctAnswerIndex) + '. ' : '') + options[correctAnswerIndex]}</p>
                </div>
            )}

            <Separator/>
            <div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Info className="text-primary"/> Explicação Detalhada:</h3>
              <Alert variant="default" className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-wrap text-sm">
                    {explanation}
                </AlertDescription>
              </Alert>
            </div>
            
            {legalTextContext && (
            <>
            <Separator/>
             <div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><FileText className="text-primary"/> Contexto Legal Original Fornecido:</h3>
              <ScrollArea className="h-32 bg-muted/30 p-3 rounded-md border">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {legalTextContext}
                </p>
              </ScrollArea>
            </div>
            </>
            )}

            <Separator/>
            <div>
                <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><ImageIconLucide className="text-orange-400"/> Imagem (Semelhante de Fontes):</h3>
                {simulatedSourcedImageUrl && simulatedSourcedImageDescription && !noImageResponseRegex.test(simulatedSourcedImageDescription) ? (
                    <>
                        <p className="text-sm text-muted-foreground mb-2 italic">"{simulatedSourcedImageDescription}"</p>
                        <div className="flex justify-center items-center p-2 border rounded-md bg-muted/30 my-2 max-w-xs mx-auto">
                            <NextImage 
                                src={simulatedSourcedImageUrl} 
                                alt={simulatedSourcedImageDescription}
                                width={250} 
                                height={180}
                                className="rounded-md object-cover"
                                data-ai-hint={generateAiHint(simulatedSourcedImageDescription)}
                            />
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground text-center italic py-4">Imagem do assunto não encontrada.</p>
                )}
            </div>

            {aiGeneratedMnemonics && aiGeneratedMnemonics.length > 0 && (
              <>
                <Separator/>
                <div>
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Lightbulb className="text-primary"/> Macetes (Gerados por IA):</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-5">
                    {aiGeneratedMnemonics.map((m, i) => <li key={`hist-ai-mne-${i}`}>{m}</li>)}
                  </ul>
                </div>
              </>
            )}

            {simulatedSourcedMnemonic && (
                <>
                <Separator/>
                <div>
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Lightbulb className="text-orange-500"/> Exemplo de Macete (Semelhante de Fontes):</h3>
                    <p className="text-muted-foreground italic">"{simulatedSourcedMnemonic}"</p>
                </div>
                </>
            )}

            {(externalSearchLinks && externalSearchLinks.length > 0) || videoPlatforms.some(vp => externalSearchLinks?.some(link => link.type === vp.type)) ? (
                <>
                <Separator/>
                <div>
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><LinkIcon className="text-primary"/> Links Úteis (Pesquisa Semelhante):</h3>
                  <ul className="list-disc list-inside space-y-1 pl-5 text-sm">
                    {videoPlatforms.map(platform => {
                        const platformLinks = externalSearchLinks?.filter(link => link.type === platform.type);
                        if (platformLinks && platformLinks.length > 0) {
                        return platformLinks.map((link, idx) => (
                            <li key={`hist-vid-link-${platform.type}-${idx}`} className="flex items-center gap-1">
                            <platform.icon className="h-4 w-4 text-accent" />
                            <a href={link.link.startsWith('http') ? link.link : `http://${link.link}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate" title={link.link}>
                                {link.title || link.link}
                            </a>
                            </li>
                        ));
                        }
                        return (
                        <li key={`hist-vid-link-nf-${platform.type}`} className="flex items-center gap-1 text-muted-foreground">
                            <platform.icon className="h-4 w-4" /> {platform.name}: Não encontrado
                        </li>
                        );
                    })}
                    {externalSearchLinks?.filter(link => !videoPlatforms.some(vp => vp.type === link.type)).map((link, idx) => (
                        <li key={`hist-other-link-${idx}`} className="flex items-center gap-1">
                        <LinkIcon className="h-4 w-4 text-accent" />
                        <a href={link.link.startsWith('http') ? link.link : `http://${link.link}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate" title={link.link}>
                            {link.title || link.link}
                        </a>
                        </li>
                    ))}
                  </ul>
                </div>
                </>
            ) : (
                <>
                <Separator/>
                <div>
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><LinkIcon className="text-primary"/> Links Úteis (Pesquisa Semelhante):</h3>
                    {videoPlatforms.map(platform => (
                        <p key={`hist-vid-link-nf-all-${platform.type}`} className="flex items-center gap-1 text-sm text-muted-foreground pl-5">
                            <platform.icon className="h-4 w-4" /> {platform.name}: Não encontrado
                        </p>
                    ))}
                    <p className="text-sm text-muted-foreground pl-5">Outros links: Não encontrados</p>
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
