
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { generateQuestions } from '@/ai/flows/generate-questions';
import { enhanceAnswerWithInternetSearch } from '@/ai/flows/enhance-answer-with-internet-search';
import { generateMnemonics } from '@/ai/flows/generate-mnemonics';
import type { IQGeneratedQuestion, IAnsweredQuestion, QuestionStyle } from '@/types';
import { addQuestionToHistory } from '@/lib/localStorage';
import { Loader2, Lightbulb, Link as LinkIcon, Info, FileText, CheckCircle2, XCircle, RefreshCcw, Send, MessageCircleQuestion, Edit3, ListChecks, Settings2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const [legalText, setLegalText] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(1);
  const [questionStyle, setQuestionStyle] = useState<QuestionStyle>('mcq4');
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
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
    setCurrentEnhancedDetails(null);
  }, [legalText, generatedQuestions, currentQuestionIndex]);


  const handleGenerateQuestions = async (event: FormEvent) => {
    event.preventDefault();
    if (!legalText.trim()) {
      toast({ title: 'Texto Legal Ausente', description: 'Por favor, insira um trecho de lei para análise.', variant: 'destructive' });
      return;
    }
    if (numQuestions <= 0 || numQuestions > 10) {
      toast({ title: 'Número de Questões Inválido', description: 'Por favor, insira um número de questões entre 1 e 10.', variant: 'destructive' });
      return;
    }

    setIsLoadingQuestions(true);
    setGeneratedQuestions([]); 
    setCurrentQuestionIndex(0);

    try {
      const result = await generateQuestions({ legalText, numQuestions, questionStyle });
      if (result.questions && result.questions.length > 0) {
        setGeneratedQuestions(result.questions);
        toast({ title: 'Sucesso!', description: `${result.questions.length} questão(ões) gerada(s) no estilo ${questionStyle}.` });
      } else {
        toast({ title: 'Nenhuma questão gerada', description: 'A IA não conseguiu gerar questões com os parâmetros fornecidos. Tente um texto legal diferente, ajuste as configurações ou tente novamente.', variant: 'default' });
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast({ title: 'Erro ao Gerar Questões', description: error.message || 'Ocorreu um erro inesperado. Tente novamente mais tarde.', variant: 'destructive' });
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
      toast({ title: 'Quiz Concluído!', description: 'Você respondeu todas as questões geradas.' });
    }
  };

  const handleNewAnalysis = () => {
    setLegalText('');
    setNumQuestions(1);
    setQuestionStyle('mcq4');
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
            <FileText className="text-primary" /> Gerador de Questões Jurídicas
          </CardTitle>
          <CardDescription>
            Insira um trecho de lei, defina o número e o estilo das questões, e comece a praticar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateQuestions} className="space-y-6">
            <div>
              <Label htmlFor="legalText" className="text-base font-medium">Trecho da Lei</Label>
              <Textarea
                id="legalText"
                placeholder="Cole aqui o trecho da lei (ex: Art. 5º da Constituição)..."
                value={legalText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLegalText(e.target.value)}
                rows={6}
                className="text-base mt-1"
                disabled={isLoadingQuestions}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="numQuestions" className="text-base font-medium">Número de Questões</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  min="1"
                  max="10"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                  className="text-base mt-1 w-24"
                  disabled={isLoadingQuestions}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-base font-medium">Estilo das Questões</Label>
                <RadioGroup
                  value={questionStyle}
                  onValueChange={(value) => setQuestionStyle(value as QuestionStyle)}
                  className="flex flex-col gap-2 pt-1 sm:flex-row sm:gap-3"
                  disabled={isLoadingQuestions}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cespe" id="q-style-cespe" />
                    <Label htmlFor="q-style-cespe" className="font-normal text-sm cursor-pointer">Certo/Errado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mcq4" id="q-style-mcq4" />
                    <Label htmlFor="q-style-mcq4" className="font-normal text-sm cursor-pointer">4 Opções (A-D)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mcq5" id="q-style-mcq5" />
                    <Label htmlFor="q-style-mcq5" className="font-normal text-sm cursor-pointer">5 Opções (A-E)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" disabled={isLoadingQuestions || !legalText.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                {isLoadingQuestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings2 className="mr-2 h-4 w-4" />}
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
               <span className="text-sm font-normal text-muted-foreground ml-auto">
                (Estilo: {currentQuestion.questionStyle === 'cespe' ? 'Certo/Errado' : `${currentQuestion.options.length} Opções`})
              </span>
            </CardTitle>
            <CardDescription className="text-lg whitespace-pre-wrap pt-2">{currentQuestion.question}</CardDescription>
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
              <Button onClick={handleNextQuestion} disabled={currentQuestionIndex >= generatedQuestions.length - 1 && isAnswerSubmitted} className="w-full sm:w-auto">
                {currentQuestionIndex >= generatedQuestions.length - 1 ? 'Quiz Finalizado' : 'Próxima Questão'}
                 {currentQuestionIndex < generatedQuestions.length - 1 && <Edit3 className="ml-2 h-4 w-4" />}
                 {currentQuestionIndex >= generatedQuestions.length -1 && <ListChecks className="ml-2 h-4 w-4"/>}
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
            <Alert variant={selectedAnswerIndex === currentQuestion.correctAnswerIndex ? 'default' : 'destructive'} className={selectedAnswerIndex === currentQuestion.correctAnswerIndex ? 'bg-green-50 dark:bg-green-800/30 border-green-300 dark:border-green-600' : 'bg-red-50 dark:bg-red-800/30 border-red-300 dark:border-red-600'}>
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
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Info className="text-primary"/> Explicação Detalhada</h3>
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
