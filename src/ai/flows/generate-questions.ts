
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
  console.log('generateQuestions flow started with input:', JSON.stringify(input));
  try {
    const result = await generateQuestionsFlow(input);
    console.log('generateQuestions flow finished successfully.');
    return result;
  } catch (error) {
    console.error('Critical error in generateQuestions flow:', error);
    // Rethrow the error or return a structured error response
    // For now, rethrowing to let the client handle a generic server error
    // In a more mature app, you might return a specific error structure.
    throw error; 
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
  async (input) => {
    let allBaseQuestions: (z.infer<typeof BaseQuestionObjectSchema> & { source: string, questionStyle: GenerateQuestionsInput['questionStyle'] })[] = [];

    // 1. Generate INÉDITA DANTASAI questions
    try {
      console.log('Attempting to generate INÉDITA DANTASAI questions...');
      const {output: ineditaOutput, text: ineditaRawText} = await generateBaseQuestionsPrompt(input);
      if (ineditaOutput && ineditaOutput.questions) {
        allBaseQuestions.push(
          ...ineditaOutput.questions.map(q => ({ 
              ...q, 
              source: "INÉDITA DANTASAI",
              questionStyle: input.questionStyle 
          }))
        );
        console.log(`Successfully generated ${ineditaOutput.questions.length} INÉDITA DANTASAI questions.`);
      } else {
        console.warn('generateQuestionsFlow: Failed to generate INÉDITA DANTASAI questions or output was malformed. Raw LLM response:', ineditaRawText, 'Input:', input);
      }
    } catch (error) {
      console.error('Error during INÉDITA DANTASAI question generation:', error, 'Input:', input);
      // Optionally, rethrow or handle to allow partial results if only this part fails
    }

    // 2. Fetch/Generate SIMULATED EXTERNAL questions if requested
    if (input.fetchSimulatedExternal && (input.numSimulatedExternal || 0) > 0) {
      const externalInput: FindSimulatedExternalQuestionsInput = {
        legalText: input.legalText,
        subject: input.subject,
        topic: input.topic,
        numQuestions: input.numSimulatedExternal || 2,
        targetQuestionStyle: input.questionStyle, 
      };
      try {
        console.log('Attempting to generate SIMULATED EXTERNAL questions...');
        const externalResult = await findSimulatedExternalQuestions(externalInput);
        if (externalResult.questions && externalResult.questions.length > 0) {
          allBaseQuestions.push(...externalResult.questions.map(q => ({...q, questionStyle: q.questionStyle || input.questionStyle }))); 
          console.log(`Successfully generated ${externalResult.questions.length} SIMULATED EXTERNAL questions.`);
        } else {
          console.warn('generateQuestionsFlow: No SIMULATED EXTERNAL questions were generated or returned.', 'Input to findSimulatedExternalQuestions:', externalInput);
        }
      } catch (e) {
         console.error('generateQuestionsFlow: Error fetching/generating simulated external questions:', e, 'Input:', externalInput);
      }
    }
    
    if (allBaseQuestions.length === 0) {
       const errorMsg = 'A IA falhou ao gerar as questões base (INÉDITA DANTASAI e/ou Semelhantes). Verifique o console do servidor para mais detalhes.';
       console.error(errorMsg, 'Input to generateQuestionsFlow:', input);
       // For now, returning an empty array to satisfy the schema, but ideally, throw a more specific error
       // that the client can interpret. However, the top-level try/catch in generateQuestions will handle this.
       // throw new Error(errorMsg); 
       return { questions: [] }; // Return empty to fulfill schema if no questions generated at all
    }

    const enrichedQuestions: IQGeneratedQuestion[] = []; 

    // 3. Enrich ALL questions
    for (const baseQuestion of allBaseQuestions) {
      if (!baseQuestion.question || !baseQuestion.options || baseQuestion.correctAnswerIndex === undefined || !baseQuestion.explanation) {
        console.warn('Skipping enrichment for malformed base question:', baseQuestion);
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
        });
        continue;
      }
      
      const keyConcept = baseQuestion.keyConceptForEnrichment || baseQuestion.question.substring(0,50); 
      let enrichedData: Partial<IQGeneratedQuestion> = {};

      try {
        console.log(`Enriching question ID (temp): ${baseQuestion.source} - ${baseQuestion.question.substring(0,20)}...`);
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

        const [mnemonicsResult, searchResult] = await Promise.allSettled([
          generateMnemonics(mnemonicInput),
          enhanceAnswerWithInternetSearch(searchInput),
        ]);

        if (mnemonicsResult.status === 'fulfilled') {
          enrichedData.aiGeneratedMnemonics = mnemonicsResult.value.mnemonics;
        } else {
          console.warn('Mnemonic generation failed for a question:', mnemonicsResult.reason);
          enrichedData.aiGeneratedMnemonics = [];
        }
        
        if (searchResult.status === 'fulfilled' && searchResult.value) {
            enrichedData.externalSearchLinks = searchResult.value.searchLinks;
            enrichedData.simulatedSourcedImageDescription = searchResult.value.simulatedSourcedImageDescription;
            enrichedData.simulatedSourcedImageUrl = searchResult.value.simulatedSourcedImageUrl;
            enrichedData.simulatedSourcedMnemonic = searchResult.value.simulatedSourcedMnemonic;
        } else if (searchResult.status === 'rejected') {
             console.warn('Internet search enhancement failed for a question:', searchResult.reason);
        }
        
        enrichedQuestions.push({
          ...baseQuestion,
          id: `${Date.now()}-q-${enrichedQuestions.length}-${Math.random().toString(16).slice(2)}`,
          questionStyle: baseQuestion.questionStyle, 
          source: baseQuestion.source, 
          subject: input.subject,
          topic: input.topic,
          ...enrichedData,
        });

      } catch (enrichmentError) {
        console.error('Critical error during question enrichment loop:', enrichmentError, 'Base question:', baseQuestion);
         enrichedQuestions.push({
          ...baseQuestion,
          id: `${Date.now()}-enricherror-${enrichedQuestions.length}-${Math.random().toString(16).slice(2)}`,
          questionStyle: baseQuestion.questionStyle,
          source: baseQuestion.source,
          subject: input.subject,
          topic: input.topic,
          // Add empty enrichments to satisfy schema if all else fails
          aiGeneratedMnemonics: [],
          externalSearchLinks: [],
        });
      }
    }
    
    if (enrichedQuestions.length === 0 && allBaseQuestions.length > 0) {
         console.warn(`generateQuestionsFlow: All base questions were generated but all failed enrichment. Base count: ${allBaseQuestions.length}`);
    } else if (enrichedQuestions.length < allBaseQuestions.length) {
         console.warn(`generateQuestionsFlow: Some questions failed enrichment. Base count: ${allBaseQuestions.length}, Enriched count: ${enrichedQuestions.length}`);
    }

    console.log(`generateQuestionsFlow successfully processed. Total enriched questions: ${enrichedQuestions.length}`);
    return { questions: enrichedQuestions };
  }
);
