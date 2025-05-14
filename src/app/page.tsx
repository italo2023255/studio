'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { generateQuestions } from '@/ai/flows/generate-questions';
import { enhanceAnswerWithInternetSearch } from '@/ai/flows/enhance-answer-with-internet-search';
import { generateMnemonics } from '@/ai/flows/generate-mnemonics';
import type { IQGeneratedQuestion, IAnsweredQuestion } from '@/types';
import { addQuestionToHistory } from '@/lib/localStorage';
import { Loader2, Lightbulb, Link as LinkIcon, Info, FileText, CheckCircle2, XCircle, RefreshCcw, Send, MessageCircleQuestion, Edit3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const [legalText, setLegalText] = useState<string>('');
  const [generatedQuestions, setGeneratedQuestions] = useState<IQGeneratedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [currentEnhancedDetails, setCurrentEnhancedDetails] = useState<{
    enhancedExplanation?: string;
    additionalSearchLinks?: string[];
    generatedMnemonics?: string[];
  } | null>(null);
  
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);

  const { toast } = useToast();

  const currentQuestion = generatedQuestions[currentQuestionIndex];

  useEffect(() => {
    // Reset states when legal text changes or new questions are generated implicitly
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
    setCurrentEnhancedDetails(null);
  }, [legalText, generatedQuestions, currentQuestionIndex]);


  const handleGenerateQuestions = async (event: FormEvent) => {
    event.preventDefault();
    if (!legalText.trim()) {
      toast({ title: 'Erro', description: 'Por favor, insira um trecho de lei.', variant: 'destructive' });
      return;
    }
    setIsLoadingQuestions(true);
    setGeneratedQuestions([]); // Clear previous questions
    setCurrentQuestionIndex(0);


    try {
      const result = await generateQuestions({ legalText });
      if (result.questions && result.questions.length > 0) {
        setGeneratedQuestions(result.questions);
        toast({ title: 'Sucesso!', description: `${result.questions.length} questão(ões) gerada(s).` });
      } else {
        toast({ title: 'Nenhuma questão gerada', description: 'Tente um texto legal diferente ou mais específico.', variant: 'default' });
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({ title: 'Erro ao gerar questões', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswerIndex === null || !currentQuestion) return;

    setIsLoadingExplanation(true);
    setIsAnswerSubmitted(true);

    const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswerIndex;
    let enhancedData: { enhancedExplanation?: string; additionalSearchLinks?: string[]; generatedMnemonics?: string[] } = {};

    try {
      // Fetch enhanced explanation and mnemonics in parallel
      const [enhancementResult, mnemonicsResult] = await Promise.all([
        enhanceAnswerWithInternetSearch({
          legalText,
          question: currentQuestion.question,
          answer: currentQuestion.options[currentQuestion.correctAnswerIndex],
        }),
        generateMnemonics({
          legalText,
          question: currentQuestion.question,
          answer: currentQuestion.options[currentQuestion.correctAnswerIndex],
        }),
      ]);

      enhancedData.enhancedExplanation = enhancementResult.enhancedAnswer;
      enhancedData.additionalSearchLinks = enhancementResult.searchLinks;
      enhancedData.generatedMnemonics = mnemonicsResult.mnemonics;
      
      setCurrentEnhancedDetails(enhancedData);

    } catch (error) {
      console.error('Error fetching enhancements:', error);
      toast({ title: 'Erro ao buscar informações adicionais', description: 'Exibindo informações básicas.', variant: 'destructive' });
    } finally {
      setIsLoadingExplanation(false);
    }
    
    const answeredQuestion: IAnsweredQuestion = {
      ...currentQuestion,
      id: `${Date.now()}-${currentQuestionIndex}`,
      legalTextContext: legalText,
      userAnswerIndex: selectedAnswerIndex,
      isCorrect,
      enhancedExplanation: enhancedData.enhancedExplanation || currentQuestion.explanation,
      additionalSearchLinks: enhancedData.additionalSearchLinks,
      generatedMnemonics: enhancedData.generatedMnemonics,
      timestamp: Date.now(),
    };
    addQuestionToHistory(answeredQuestion);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      toast({ title: 'Quiz Concluído!', description: 'Você respondeu todas as questões.' });
      // Optionally reset or navigate
    }
  };

  const handleNewAnalysis = () => {
    setLegalText('');
    setGeneratedQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
    setCurrentEnhancedDetails(null);
    setIsLoadingQuestions(false);
    setIsLoadingExplanation(false);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="text-primary" /> Analisador de Texto Legal
          </CardTitle>
          <CardDescription>
            Insira um trecho de lei para gerar questões de múltipla escolha, obter explicações detalhadas, dicas de memorização e mais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateQuestions} className="space-y-4">
            <Textarea
              placeholder="Cole aqui o trecho da lei (ex: Art. 5º da Constituição)..."
              value={legalText}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLegalText(e.target.value)}
              rows={8}
              className="text-base"
              disabled={isLoadingQuestions}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={isLoadingQuestions || !legalText.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                {isLoadingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Gerar Questões
              </Button>
              <Button type="button" variant="outline" onClick={handleNewAnalysis} disabled={isLoadingQuestions} className="w-full sm:w-auto">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Nova Análise
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {generatedQuestions.length > 0 && currentQuestion && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageCircleQuestion className="text-primary"/> Questão {currentQuestionIndex + 1} de {generatedQuestions.length}
            </CardTitle>
            <CardDescription className="text-lg whitespace-pre-wrap">{currentQuestion.question}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={selectedAnswerIndex !== null ? selectedAnswerIndex.toString() : undefined}
              onValueChange={(value) => setSelectedAnswerIndex(parseInt(value))}
              disabled={isAnswerSubmitted || isLoadingExplanation}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 text-base cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
            {!isAnswerSubmitted ? (
              <Button onClick={handleSubmitAnswer} disabled={selectedAnswerIndex === null || isLoadingExplanation} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
                {isLoadingExplanation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Verificar Resposta
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} disabled={currentQuestionIndex >= generatedQuestions.length - 1} className="w-full sm:w-auto">
                Próxima Questão <Edit3 className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {isAnswerSubmitted && currentQuestion && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-xl ${selectedAnswerIndex === currentQuestion.correctAnswerIndex ? 'text-green-600' : 'text-red-600'}`}>
              {selectedAnswerIndex === currentQuestion.correctAnswerIndex ? <CheckCircle2 /> : <XCircle />}
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant={selectedAnswerIndex === currentQuestion.correctAnswerIndex ? 'default' : 'destructive'} className={selectedAnswerIndex === currentQuestion.correctAnswerIndex ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}>
              <AlertTitle className="font-semibold">
                {selectedAnswerIndex === currentQuestion.correctAnswerIndex
                  ? 'Resposta Correta!'
                  : 'Resposta Incorreta.'}
              </AlertTitle>
              <AlertDescription>
                Sua resposta: {currentQuestion.options[selectedAnswerIndex!]}.<br />
                Resposta correta: {currentQuestion.options[currentQuestion.correctAnswerIndex]}.
              </AlertDescription>
            </Alert>

            {isLoadingExplanation && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Buscando informações adicionais...</span>
              </div>
            )}
            
            {!isLoadingExplanation && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Info className="text-primary"/> Explicação</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {currentEnhancedDetails?.enhancedExplanation || currentQuestion.explanation}
                  </p>
                </div>

                {(currentQuestion.mnemonic || (currentEnhancedDetails?.generatedMnemonics && currentEnhancedDetails.generatedMnemonics.length > 0)) && (
                  <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Lightbulb className="text-primary"/> Dicas e Macetes</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {currentQuestion.mnemonic && <li>{currentQuestion.mnemonic}</li>}
                      {currentEnhancedDetails?.generatedMnemonics?.map((mnemonic, idx) => (
                        <li key={`gen-mne-${idx}`}>{mnemonic}</li>
                      ))}
                    </ul>
                  </div>
                  </>
                )}
                
                {(currentQuestion.searchLinks || (currentEnhancedDetails?.additionalSearchLinks && currentEnhancedDetails.additionalSearchLinks.length > 0)) && (
                   <>
                   <Separator />
                   <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><LinkIcon className="text-primary"/> Links Úteis</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {currentQuestion.searchLinks?.map((link, idx) => (
                        <li key={`sl-${idx}`}><a href={link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{link}</a></li>
                      ))}
                      {currentEnhancedDetails?.additionalSearchLinks?.map((link, idx) => (
                        <li key={`add-sl-${idx}`}><a href={link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{link}</a></li>
                      ))}
                    </ul>
                  </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
