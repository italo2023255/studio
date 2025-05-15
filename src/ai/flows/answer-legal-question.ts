
'use server';
/**
 * @fileOverview This flow answers a user's legal question by finding relevant legal text,
 * providing an explanation, and enriching it with mnemonics, internet search results,
 * and a generated image.
 *
 * - answerLegalQuestion - Main function to answer a user's legal question.
 * - AnswerLegalQuestionInput - Input type for the flow.
 * - AnswerLegalQuestionOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateMnemonics, type GenerateMnemonicsInput } from './generate-mnemonics';
import { enhanceAnswerWithInternetSearch, type EnhanceAnswerWithInternetSearchInput, type EnhanceAnswerWithInternetSearchOutput } from './enhance-answer-with-internet-search';
import { generateImageForQuestion, type GenerateImageForQuestionInput, type GenerateImageForQuestionOutput } from './generate-image-for-question';

// Input Schema
const AnswerLegalQuestionInputSchema = z.object({
  userQuestion: z.string().describe('The legal question asked by the user.'),
});
export type AnswerLegalQuestionInput = z.infer<typeof AnswerLegalQuestionInputSchema>;

// Output Schema (mirrors parts of ILegalAnswer for clarity)
const AnswerLegalQuestionOutputSchema = z.object({
  userQuestion: z.string(),
  explanation: z.string().describe('Detailed explanation of the answer to the user question.'),
  citedArticle: z.string().describe('The exact legal article or text snippet that answers the question.'),
  aiGeneratedImageDataUri: z.string().url().nullable().describe('Data URI of an AI-generated conceptual image related to the question/article. Null if generation failed.'),
  aiGeneratedMnemonics: z.array(z.string()).optional().describe('AI-generated mnemonics for the cited article.'),
  enhancedExplanation: z.string().optional().describe('Explanation potentially enhanced by simulated internet search findings.'),
  externalSearchLinks: z.array(z.string().url()).optional().describe('Links to external resources (jurisprudence, blogs, videos).'),
  sourcedImageDescription: z.string().optional().describe('Description of an ideal image from a specialized source (e.g., legal forum, contest site).'),
  sourcedImageUrl: z.string().url().optional().describe('Placeholder URL for the described "sourced" image.'),
  sourcedMnemonic: z.string().optional().describe('A mnemonic as if found on a specialized site/forum, confirmed by reliable sources.'),
});
export type AnswerLegalQuestionOutput = z.infer<typeof AnswerLegalQuestionOutputSchema>;


// Main exported function
export async function answerLegalQuestion(input: AnswerLegalQuestionInput): Promise<AnswerLegalQuestionOutput> {
  return answerLegalQuestionFlow(input);
}

// Core prompt for finding the article and initial explanation
const mainPrompt = ai.definePrompt({
  name: 'answerLegalQuestionMainPrompt',
  input: { schema: AnswerLegalQuestionInputSchema },
  output: { schema: z.object({
    explanation: z.string().describe('Detailed explanation of the answer to the user question, based *strictly* on the identified legal article. Ensure the explanation directly addresses the user question using the legal text.'),
    citedArticle: z.string().describe('The exact legal article or text snippet (e.g., "Art. 5º, inciso X, da Constituição Federal de 1988: são invioláveis a intimidade, a vida privada, a honra e a imagem das pessoas...") that directly answers the user question. Include the full identification of the law and article number.'),
    keyConceptForImageAndMnemonic: z.string().describe('A very concise key legal concept (2-3 words, e.g., "habeas corpus", "legítima defesa", "ato administrativo") derived from the question or cited article, to be used for generating an image and mnemonics.'),
  })},
  prompt: `Você é um assistente jurídico especializado em legislação brasileira.
  Sua tarefa é responder a uma pergunta do usuário, identificando o artigo de lei específico que a fundamenta e fornecendo uma explicação clara.

  Pergunta do Usuário:
  {{{userQuestion}}}

  Instruções:
  1. Analise a pergunta do usuário.
  2. Identifique o(s) artigo(s) de lei MAIS RELEVANTE(s) da legislação brasileira (Constituição Federal, Códigos, Leis específicas, etc.) que respondem DIRETAMENTE à pergunta.
  3. Extraia o TEXTO EXATO do artigo (ou o trecho mais pertinente) e sua identificação completa (ex: "Art. 155 do Código Penal - Subtrair, para si ou para outrem, coisa alheia móvel: Pena - reclusão, de um a quatro anos, e multa."). Este será o "citedArticle".
  4. Elabore uma "explanation" detalhada, baseada ESTRITAMENTE no "citedArticle", que responda à pergunta do usuário. A explicação deve parafrasear e contextualizar o artigo legal em relação à pergunta. Não adicione opiniões ou informações fora do texto legal nesta etapa.
  5. Identifique um "keyConceptForImageAndMnemonic" (2-3 palavras) que resuma o tema central da pergunta/artigo.

  O resultado DEVE ser um objeto JSON com as chaves "explanation", "citedArticle", e "keyConceptForImageAndMnemonic".
  Exemplo de "citedArticle": "Art. 5º, caput, da Constituição Federal de 1988: Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade, nos termos seguintes:"
  `,
});

// Genkit Flow
const answerLegalQuestionFlow = ai.defineFlow(
  {
    name: 'answerLegalQuestionFlow',
    inputSchema: AnswerLegalQuestionInputSchema,
    outputSchema: AnswerLegalQuestionOutputSchema,
  },
  async (input) => {
    // 1. Get initial explanation and cited article
    const mainResponse = await mainPrompt(input);
    if (!mainResponse.output || !mainResponse.output.citedArticle || !mainResponse.output.explanation) {
      console.error('answerLegalQuestionFlow: Main prompt failed to return citedArticle or explanation.', mainResponse.text);
      throw new Error('A IA não conseguiu encontrar um artigo de lei relevante ou gerar uma explicação inicial.');
    }
    const { explanation: initialExplanation, citedArticle, keyConceptForImageAndMnemonic } = mainResponse.output;

    let aiGeneratedImageDataUri: string | null = null;
    let aiGeneratedMnemonics: string[] = [];
    let enhancedOutput: EnhanceAnswerWithInternetSearchOutput | null = null;

    // 2. Perform enhancements in parallel (if possible, or sequentially if dependencies exist)
    try {
      const imageInput: GenerateImageForQuestionInput = {
        question: input.userQuestion,
        correctAnswerText: citedArticle, // Using citedArticle as "answer" for image context
        legalConcept: keyConceptForImageAndMnemonic,
      };
      const mnemonicInput: GenerateMnemonicsInput = {
        legalText: citedArticle,
        question: input.userQuestion,
        answer: initialExplanation, // Using initial explanation as "answer" for mnemonic context
      };
      const enhancementInput: EnhanceAnswerWithInternetSearchInput = {
        question: input.userQuestion,
        answer: initialExplanation, // The AI's initial answer based on the law
        legalText: citedArticle, // The specific law text
        keyConcept: keyConceptForImageAndMnemonic, // Pass the key concept
      };
      
      const [imageResult, mnemonicResult, enhancementResult] = await Promise.all([
        generateImageForQuestion(imageInput),
        generateMnemonics(mnemonicInput),
        enhanceAnswerWithInternetSearch(enhancementInput),
      ]);

      aiGeneratedImageDataUri = imageResult.imageDataUri;
      aiGeneratedMnemonics = mnemonicResult.mnemonics;
      enhancedOutput = enhancementResult;

    } catch (error) {
      console.error('Error during enhancement steps in answerLegalQuestionFlow:', error);
      // Continue with base information if enhancements fail
    }

    return {
      userQuestion: input.userQuestion,
      explanation: initialExplanation,
      citedArticle,
      aiGeneratedImageDataUri,
      aiGeneratedMnemonics: aiGeneratedMnemonics.length > 0 ? aiGeneratedMnemonics : undefined,
      enhancedExplanation: enhancedOutput?.enhancedAnswer || initialExplanation, // Fallback to initial
      externalSearchLinks: enhancedOutput?.searchLinks,
      sourcedImageDescription: enhancedOutput?.simulatedSourcedImageDescription,
      sourcedImageUrl: enhancedOutput?.simulatedSourcedImageUrl,
      sourcedMnemonic: enhancedOutput?.simulatedSourcedMnemonic,
    };
  }
);
