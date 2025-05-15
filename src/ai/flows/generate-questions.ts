
'use server';

/**
 * @fileOverview Generates multiple-choice or true/false questions from legal text,
 * then enriches each question with mnemonics, search links, and a conceptual image.
 * Can also incorporate simulated external questions.
 *
 * - generateQuestions - Main function to generate and enrich questions.
 * - GenerateQuestionsInput - Input: legal text, num questions, style, option to fetch external.
 * - GenerateQuestionsOutput - Output: array of enriched IQGeneratedQuestion objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { IQGeneratedQuestion, IExternalLink } from '@/types'; 
import { generateMnemonics, type GenerateMnemonicsInput } from './generate-mnemonics';
import { enhanceAnswerWithInternetSearch, type EnhanceAnswerWithInternetSearchInput, type EnhanceAnswerWithInternetSearchOutput } from './enhance-answer-with-internet-search';
import { findSimulatedExternalQuestions, type FindSimulatedExternalQuestionsInput, type FindSimulatedExternalQuestionsOutput } from './find-simulated-external-questions';

const GenerateQuestionsInputSchema = z.object({
  legalText: z.string().describe('The legal text to generate questions from.'),
  numQuestions: z.number().int().min(1).max(10).describe('The number of INÉDITA DANTASAI questions to generate (1-10).'),
  questionStyle: z.enum(['cespe', 'mcq4', 'mcq5']).describe('The style of the questions: "cespe" (True/False), "mcq4" (4 multiple choice options), "mcq5" (5 multiple choice options).'),
  subject: z.string().optional().describe('The subject/matéria of the legal text.'),
  topic: z.string().optional().describe('The specific topic within the subject.'),
  fetchSimulatedExternal: z.boolean().optional().default(false).describe('Whether to include simulated questions from exam boards.'),
  numSimulatedExternal: z.number().int().min(1).max(3).optional().default(2).describe('Number of simulated external questions to try to fetch (1-3).')
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const BaseQuestionObjectSchema = z.object({
    question: z.string().describe('The question text or affirmative statement for Cespe style.'),
    options: z.array(z.string()).describe('Answer options. For "cespe", this will be ["Certo", "Errado"]. For "mcq4", 4 options. For "mcq5", 5 options. Options should contain only the text, without prefixes like "A)", "B)".'),
    correctAnswerIndex: z.number().int().min(0).describe('Index of the correct answer in the options array (0-1 for Cespe, 0-3 for mcq4, 0-4 for mcq5).'),
    explanation: z.string().describe('Explanation of why the answer is correct, referencing the legal text strictly (letra da lei).'),
    keyConceptForEnrichment: z.string().optional().describe('A 2-5 word key concept from the question/explanation, to guide mnemonic and image generation.'),
}).refine(
    (data) => {
      if (data.options.length === 2) { 
         return data.correctAnswerIndex === 0 || data.correctAnswerIndex === 1;
      }
      if (data.options.length === 4) { 
        return data.correctAnswerIndex >= 0 && data.correctAnswerIndex < 4;
      }
      if (data.options.length === 5) { 
        return data.correctAnswerIndex >= 0 && data.correctAnswerIndex < 5;
      }
      return true; 
    },
    { message: "Base question options and correctAnswerIndex do not match the implicit question style based on options length."}
);

const BaseGenerateQuestionsOutputSchema = z.object({
  questions: z.array(BaseQuestionObjectSchema).describe('An array of question objects, matching the requested style and count.'),
});

const LinkObjectSchema = z.object({
    title: z.string().describe("Title of the search result."),
    link: z.string().url().describe("URL of the search result."),
    snippet: z.string().optional().describe("A brief summary of the search result content."),
    type: z.enum(["jurisprudence", "article", "video", "forum_discussion", "youtube_video", "instagram_video", "facebook_video", "other"]).describe("Type of content.")
});

const EnrichedQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswerIndex: z.number().int().min(0),
  explanation: z.string(),
  keyConceptForEnrichment: z.string().optional(),
  id: z.string(), 
  questionStyle: z.enum(['cespe', 'mcq4', 'mcq5']),
  source: z.string(), 
  subject: z.string().optional(),
  topic: z.string().optional(),
  aiGeneratedMnemonics: z.array(z.string()).optional(),
  externalSearchLinks: z.array(LinkObjectSchema).optional(), 
  simulatedSourcedImageDescription: z.string().optional(),
  simulatedSourcedImageUrl: z.string().url().optional(),
  simulatedSourcedMnemonic: z.string().optional(),
}).refine(
  (data) => {
    switch (data.questionStyle) {
      case 'cespe':
        return data.options.length === 2 && data.correctAnswerIndex >= 0 && data.correctAnswerIndex < 2;
      case 'mcq4':
        return data.options.length === 4 && data.correctAnswerIndex >= 0 && data.correctAnswerIndex < 4;
      case 'mcq5':
        return data.options.length === 5 && data.correctAnswerIndex >= 0 && data.correctAnswerIndex < 5;
      default:
        return false; 
    }
  },
  { message: "Enriched question's options length or correctAnswerIndex does not match the specified questionStyle." }
);

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(EnrichedQuestionSchema).describe('An array of fully enriched question objects, potentially mixed sources.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;


export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  console.log('generateQuestions: Called with input:', JSON.stringify(input, null, 2));
  try {
    const result = await generateQuestionsFlow(input);
    console.log('generateQuestions: Flow finished successfully. Output question count:', result.questions.length);
    return result;
  } catch (error: any) {
    console.error('generateQuestions: CRITICAL ERROR in generateQuestionsFlow execution:', error.message, error.stack);
    throw new Error(`Failed to generate questions due to a server-side issue. Please check server logs for details. Original error: ${error.message}`);
  }
}

const generateBaseQuestionsPrompt = ai.definePrompt({
  name: 'generateIneditaDantasaiQuestionsPrompt',
  input: {schema: GenerateQuestionsInputSchema}, 
  output: {schema: BaseGenerateQuestionsOutputSchema},
  prompt: `Você é um especialista em criar questões de concurso INÉDITAS (estilo "INÉDITA DANTASAI") a partir de textos legais, no estilo especificado.
Gere {{numQuestions}} questão(ões) INÉDITAS a partir do texto legal fornecido, aderindo estritamente ao estilo '{{questionStyle}}'.
A resposta DEVE ser um objeto JSON com uma chave "questions", contendo um array de objetos de questão INÉDITA.

Instruções para cada estilo de questão:
1.  Se 'questionStyle' for 'cespe':
    *   'question': Elabore uma afirmativa sobre o texto legal.
    *   'options': Deve ser um array com duas strings: ["Certo", "Errado"].
    *   'correctAnswerIndex': 0 se "Certo" for a correta, 1 se "Errado" for.
    *   'explanation': Explicação concisa baseada na "letra da lei", justificando a resposta.
    *   'keyConceptForEnrichment': Um conceito chave de 2-5 palavras.
2.  Se 'questionStyle' for 'mcq4':
    *   'question': Elabore uma pergunta sobre o texto legal.
    *   'options': Array com 4 strings (uma correta, três distratores). NÃO inclua prefixos como "A)".
    *   'correctAnswerIndex': Índice (0-3) da opção correta.
    *   'explanation': Explicação baseada na "letra da lei".
    *   'keyConceptForEnrichment': Um conceito chave de 2-5 palavras.
3.  Se 'questionStyle' for 'mcq5':
    *   'question': Elabore uma pergunta sobre o texto legal.
    *   'options': Array com 5 strings (uma correta, quatro distratores). NÃO inclua prefixos como "A)".
    *   'correctAnswerIndex': Índice (0-4) da opção correta.
    *   'explanation': Explicação baseada na "letra da lei".
    *   'keyConceptForEnrichment': Um conceito chave de 2-5 palavras.

Certifique-se que o JSON de saída é válido. A explicação deve ser estritamente baseada no texto legal fornecido.

Texto Legal:
\`\`\`
{{{legalText}}}
\`\`\`
`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async (input): Promise<GenerateQuestionsOutput> => {
    console.log('generateQuestionsFlow: Started with input:', JSON.stringify(input, null, 2));
    let allBaseQuestions: (z.infer<typeof BaseQuestionObjectSchema> & { source: string; questionStyle: GenerateQuestionsInput['questionStyle'] })[] = [];

    // 1. Generate INÉDITA DANTASAI questions
    if (input.numQuestions > 0) {
      try {
        console.log('generateQuestionsFlow: Attempting to generate INÉDITA DANTASAI questions...');
        const {output: ineditaOutput, text: ineditaRawText} = await generateBaseQuestionsPrompt(input);
        if (ineditaOutput && ineditaOutput.questions && ineditaOutput.questions.length > 0) {
          allBaseQuestions.push(
            ...ineditaOutput.questions.map(q => ({ 
              ...q, 
              source: "INÉDITA DANTASAI",
              questionStyle: input.questionStyle 
            }))
          );
          console.log(`generateQuestionsFlow: Successfully generated ${ineditaOutput.questions.length} INÉDITA DANTASAI questions.`);
        } else {
          console.warn('generateQuestionsFlow: Failed to generate INÉDITA DANTASAI questions or output was malformed. Raw LLM response was:', ineditaRawText, '. Input was:', input);
        }
      } catch (error: any) {
        console.error('generateQuestionsFlow: Error during INÉDITA DANTASAI question generation:', error.message, error.stack, '. Input was:', input);
      }
    } else {
        console.log('generateQuestionsFlow: Skipping INÉDITA DANTASAI generation as numQuestions is 0 or less.');
    }


    // 2. Fetch/Generate SIMULATED EXTERNAL questions if requested
    if (input.fetchSimulatedExternal && (input.numSimulatedExternal || 0) > 0) {
      const externalInput: FindSimulatedExternalQuestionsInput = {
        legalText: input.legalText,
        subject: input.subject,
        topic: input.topic,
        numQuestions: input.numSimulatedExternal!, 
        targetQuestionStyle: input.questionStyle, 
      };
      try {
        console.log('generateQuestionsFlow: Attempting to generate SIMULATED EXTERNAL questions with input:', JSON.stringify(externalInput, null, 2));
        const externalResult = await findSimulatedExternalQuestions(externalInput);
        if (externalResult.questions && externalResult.questions.length > 0) {
          allBaseQuestions.push(...externalResult.questions.map(q => ({...q, questionStyle: q.questionStyle || input.questionStyle }))); 
          console.log(`generateQuestionsFlow: Successfully generated ${externalResult.questions.length} SIMULATED EXTERNAL questions.`);
        } else {
          console.warn('generateQuestionsFlow: No SIMULATED EXTERNAL questions were generated or returned.', 'Input to findSimulatedExternalQuestions:', externalInput);
        }
      } catch (e: any) {
         console.error('generateQuestionsFlow: Error fetching/generating simulated external questions:', e.message, e.stack, '. Input was:', externalInput);
      }
    } else {
        console.log('generateQuestionsFlow: Skipping SIMULATED EXTERNAL question generation.');
    }

    console.log(`generateQuestionsFlow: Total base questions generated before enrichment: ${allBaseQuestions.length}`);
    
    if (allBaseQuestions.length === 0) {
       const errorMsg = 'A IA falhou ao gerar as questões base (INÉDITA DANTASAI e/ou Semelhantes). Nenhuma questão foi gerada.';
       console.warn(errorMsg, 'Input to generateQuestionsFlow:', input);
       return { questions: [] }; 
    }

    const enrichedQuestions: IQGeneratedQuestion[] = []; 
    console.log('generateQuestionsFlow: Starting enrichment for base questions...');

    for (let i = 0; i < allBaseQuestions.length; i++) {
      const baseQuestion = allBaseQuestions[i];
      console.log(`generateQuestionsFlow: Enriching base question ${i + 1}/${allBaseQuestions.length}: ${baseQuestion.question.substring(0,30)}...`);

      if (!baseQuestion.question || !baseQuestion.options || baseQuestion.correctAnswerIndex === undefined || !baseQuestion.explanation) {
        console.warn('generateQuestionsFlow: Skipping enrichment for malformed base question:', JSON.stringify(baseQuestion, null, 2));
        enrichedQuestions.push({
            ...baseQuestion,
            id: `${Date.now()}-malformed-${Math.random().toString(16).slice(2)}`, 
            question: baseQuestion.question || "Erro: Questão não gerada corretamente",
            options: baseQuestion.options || ["Erro", "Erro"],
            correctAnswerIndex: baseQuestion.correctAnswerIndex === undefined ? 0 : baseQuestion.correctAnswerIndex,
            explanation: baseQuestion.explanation || "Erro: Explicação não gerada",
            questionStyle: baseQuestion.questionStyle || input.questionStyle,
            source: baseQuestion.source || "Erro: Fonte Desconhecida",
            subject: input.subject,
            topic: input.topic,
            aiGeneratedMnemonics: [],
            externalSearchLinks: [],
            simulatedSourcedImageDescription: "Nenhuma imagem conceitual relevante para este tema.",
            simulatedSourcedImageUrl: undefined,
            simulatedSourcedMnemonic: undefined,
        });
        continue;
      }
      
      const keyConcept = baseQuestion.keyConceptForEnrichment || baseQuestion.question.substring(0,50); 
      let currentEnrichedData: Partial<IQGeneratedQuestion> = {
         aiGeneratedMnemonics: [],
         externalSearchLinks: [],
         simulatedSourcedImageDescription: "Nenhuma imagem conceitual relevante para este tema.",
         simulatedSourcedMnemonic: undefined,
         simulatedSourcedImageUrl: undefined
      };

      try {
        const mnemonicInput: GenerateMnemonicsInput = {
          legalText: input.legalText, 
          question: baseQuestion.question,
          answer: baseQuestion.explanation, 
        };
        const searchInput: EnhanceAnswerWithInternetSearchInput = {
          question: baseQuestion.question,
          answer: baseQuestion.explanation, 
          legalText: input.legalText, 
          keyConcept: keyConcept,
        };

        const enrichmentPromises = [
          generateMnemonics(mnemonicInput),
          enhanceAnswerWithInternetSearch(searchInput),
        ];

        const results = await Promise.allSettled(enrichmentPromises);

        const mnemonicsResult = results[0];
        const searchResult = results[1];

        if (mnemonicsResult.status === 'fulfilled' && mnemonicsResult.value) {
          currentEnrichedData.aiGeneratedMnemonics = mnemonicsResult.value.mnemonics;
        } else if (mnemonicsResult.status === 'rejected'){
          console.warn(`generateQuestionsFlow: Mnemonic generation failed for question "${baseQuestion.question.substring(0,30)}...":`, mnemonicsResult.reason);
        }
        
        if (searchResult.status === 'fulfilled' && searchResult.value) {
            currentEnrichedData.externalSearchLinks = searchResult.value.searchLinks || [];
            currentEnrichedData.simulatedSourcedImageDescription = searchResult.value.simulatedSourcedImageDescription || "Nenhuma imagem conceitual relevante para este tema.";
            currentEnrichedData.simulatedSourcedImageUrl = searchResult.value.simulatedSourcedImageUrl;
            currentEnrichedData.simulatedSourcedMnemonic = searchResult.value.simulatedSourcedMnemonic;
        } else if (searchResult.status === 'rejected') {
             console.warn(`generateQuestionsFlow: Internet search enhancement failed for question "${baseQuestion.question.substring(0,30)}...":`, searchResult.reason);
        }
        
        const finalEnrichedQuestion: IQGeneratedQuestion = {
          ...baseQuestion,
          id: `${Date.now()}-q-${enrichedQuestions.length}-${Math.random().toString(16).slice(2)}`,
          questionStyle: baseQuestion.questionStyle, 
          source: baseQuestion.source, 
          subject: input.subject,
          topic: input.topic,
          ...currentEnrichedData,
          aiGeneratedMnemonics: currentEnrichedData.aiGeneratedMnemonics || [],
          externalSearchLinks: currentEnrichedData.externalSearchLinks || [],
          simulatedSourcedImageDescription: currentEnrichedData.simulatedSourcedImageDescription || "Nenhuma imagem conceitual relevante para este tema.",
          simulatedSourcedImageUrl: currentEnrichedData.simulatedSourcedImageUrl,
          simulatedSourcedMnemonic: currentEnrichedData.simulatedSourcedMnemonic,
        };
        enrichedQuestions.push(finalEnrichedQuestion);
        console.log(`generateQuestionsFlow: Successfully enriched question ${i + 1}`);

      } catch (enrichmentError: any) {
        console.error(`generateQuestionsFlow: CRITICAL error during individual question enrichment for "${baseQuestion.question.substring(0,30)}...":`, enrichmentError.message, enrichmentError.stack);
         enrichedQuestions.push({
          ...baseQuestion,
          id: `${Date.now()}-enricherror-${enrichedQuestions.length}-${Math.random().toString(16).slice(2)}`,
          questionStyle: baseQuestion.questionStyle,
          source: baseQuestion.source,
          subject: input.subject,
          topic: input.topic,
          aiGeneratedMnemonics: [],
          externalSearchLinks: [],
          simulatedSourcedImageDescription: "Nenhuma imagem conceitual relevante para este tema.",
          simulatedSourcedImageUrl: undefined,
          simulatedSourcedMnemonic: undefined,
        });
      }
    }
    
    if (enrichedQuestions.length === 0 && allBaseQuestions.length > 0) {
         console.warn(`generateQuestionsFlow: All base questions were generated (${allBaseQuestions.length}) but all failed enrichment or were malformed.`);
    } else if (enrichedQuestions.length < allBaseQuestions.length) {
         console.warn(`generateQuestionsFlow: Some questions failed enrichment. Base count: ${allBaseQuestions.length}, Enriched count: ${enrichedQuestions.length}`);
    }

    console.log(`generateQuestionsFlow: Finalizing. Total enriched questions to be returned: ${enrichedQuestions.length}`);
    return { questions: enrichedQuestions };
  }
);

