
'use server';

/**
 * @fileOverview Simulates finding existing exam questions from various boards.
 * The AI is instructed to *create* plausible questions and attribute them to
 * exam boards.
 *
 * - findSimulatedExternalQuestions - Main function.
 * - FindSimulatedExternalQuestionsInput - Input: legal text, subject, topic, num questions.
 * - FindSimulatedExternalQuestionsOutput - Output: array of simulated IQGeneratedQuestion objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { QuestionStyle } from '@/types'; // BaseQuestionObjectSchema is defined in generate-questions

// Schema for a single question object as expected from this simulation
// It's similar to BaseQuestionObjectSchema but ensures 'source' is always present and realistic.
const SimulatedQuestionObjectSchema = z.object({
    question: z.string().describe('The question text or affirmative statement for Cespe style.'),
    options: z.array(z.string()).describe('Answer options. For "cespe", this will be ["Certo", "Errado"]. For "mcq4", 4 options. For "mcq5", 5 options. Options should contain only the text, without prefixes like "A)", "B)".'),
    correctAnswerIndex: z.number().int().min(0).describe('Index of the correct answer in the options array.'),
    explanation: z.string().describe('Explanation of why the answer is correct, referencing the provided legal text strictly (letra da lei).'),
    keyConceptForEnrichment: z.string().optional().describe('A 2-5 word key concept from the question/explanation, to guide further enrichment.'),
    source: z.string().describe('The simulated source of the question, e.g., "Simulado: Cespe - 2023 - Analista Judiciário".'),
    questionStyle: z.enum(['cespe', 'mcq4', 'mcq5']).describe('The style of the generated question.')
}).refine(data => {
    if (data.questionStyle === 'cespe') {
        return data.options.length === 2 && data.correctAnswerIndex >= 0 && data.correctAnswerIndex < 2;
    }
    if (data.questionStyle === 'mcq4') {
        return data.options.length === 4 && data.correctAnswerIndex >= 0 && data.correctAnswerIndex < 4;
    }
    if (data.questionStyle === 'mcq5') {
        return data.options.length === 5 && data.correctAnswerIndex >= 0 && data.correctAnswerIndex < 5;
    }
    return false;
}, { message: "Options length or correctAnswerIndex does not match the specified questionStyle." });


const FindSimulatedExternalQuestionsInputSchema = z.object({
  legalText: z.string().describe('The legal text to base the questions on.'),
  subject: z.string().optional().describe('The subject/matéria of the legal text.'),
  topic: z.string().optional().describe('The specific topic within the subject.'),
  numQuestions: z.number().int().min(1).max(3).describe('The number of simulated external questions to generate (1-3).'),
  targetQuestionStyle: z.enum(['cespe', 'mcq4', 'mcq5']).describe('The desired style for the simulated questions.')
});
export type FindSimulatedExternalQuestionsInput = z.infer<typeof FindSimulatedExternalQuestionsInputSchema>;

const FindSimulatedExternalQuestionsOutputSchema = z.object({
  questions: z.array(SimulatedQuestionObjectSchema).describe('An array of simulated external question objects.'),
});
export type FindSimulatedExternalQuestionsOutput = z.infer<typeof FindSimulatedExternalQuestionsOutputSchema>;


export async function findSimulatedExternalQuestions(
  input: FindSimulatedExternalQuestionsInput
): Promise<FindSimulatedExternalQuestionsOutput> {
  return findSimulatedExternalQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findSimulatedExternalQuestionsPrompt',
  input: {schema: FindSimulatedExternalQuestionsInputSchema},
  output: {schema: FindSimulatedExternalQuestionsOutputSchema},
  prompt: `Você é um assistente especialista em criar questões de concurso que PAREÇAM ter sido extraídas de bancas examinadoras reais (como Cespe/Cebraspe, FGV, FCC, Vunesp, Idecan).
Sua tarefa é GERAR {{numQuestions}} questão(ões) no estilo '{{targetQuestionStyle}}' com base no texto legal, matéria e tópico fornecidos.
Para CADA questão, você DEVE:
1.  Formular uma 'question' (pergunta ou afirmativa para estilo Cespe).
2.  Criar 'options' (A-D ou A-E para múltipla escolha; "Certo", "Errado" para Cespe). NÃO inclua prefixos como "A)" nas opções.
3.  Definir 'correctAnswerIndex' (0-3 para MCQ4, 0-4 para MCQ5, 0-1 para Cespe).
4.  Escrever uma 'explanation' concisa, justificando a resposta CORRETA e baseada ESTRITAMENTE no TEXTO LEGAL fornecido.
5.  Criar um 'keyConceptForEnrichment' (2-5 palavras) relevante para a questão.
6.  Inventar um campo 'source' realista, prefixado com "Simulado: ", indicando uma banca e um concurso fictício. Exemplos: "Simulado: Cespe - 2023 - Analista Judiciário", "Simulado: FGV - 2022 - Auditor Fiscal", "Simulado: FCC - 2024 - Técnico Legislativo". Varie as bancas.
7.  Definir o campo 'questionStyle' para corresponder a '{{targetQuestionStyle}}'.

O resultado DEVE ser um objeto JSON com uma chave "questions", contendo um array destes objetos de questão.

TEXTO LEGAL BASE:
\`\`\`
{{{legalText}}}
\`\`\`

{{#if subject}}
MATÉRIA: {{{subject}}}
{{/if}}
{{#if topic}}
TÓPICO: {{{topic}}}
{{/if}}

Exemplo de uma questão múltipla escolha (mcq4) no array 'questions':
{
  "question": "De acordo com o Art. X da Lei Y, qual é o prazo para recurso?",
  "options": ["10 dias", "15 dias", "20 dias", "30 dias"],
  "correctAnswerIndex": 1,
  "explanation": "Conforme o Art. X da Lei Y, o prazo para recurso é de 15 dias.",
  "keyConceptForEnrichment": "prazo recursal lei Y",
  "source": "Simulado: Vunesp - 2023 - Escrevente Técnico",
  "questionStyle": "mcq4"
}

Exemplo de uma questão Cespe no array 'questions':
{
  "question": "O Art. Z da Lei W estabelece que o servidor será demitido em caso de abandono de cargo.",
  "options": ["Certo", "Errado"],
  "correctAnswerIndex": 0,
  "explanation": "Correto. O Art. Z da Lei W dispõe sobre a demissão por abandono de cargo.",
  "keyConceptForEnrichment": "abandono de cargo lei W",
  "source": "Simulado: Cespe - 2022 - Policial Federal",
  "questionStyle": "cespe"
}
`,
});

const findSimulatedExternalQuestionsFlow = ai.defineFlow(
  {
    name: 'findSimulatedExternalQuestionsFlow',
    inputSchema: FindSimulatedExternalQuestionsInputSchema,
    outputSchema: FindSimulatedExternalQuestionsOutputSchema,
  },
  async (input) => {
    const {output, text: rawText} = await prompt(input);
    if (!output || !output.questions || output.questions.length === 0) {
      console.error(
        'findSimulatedExternalQuestionsFlow: Failed to generate simulated questions or output was invalid. Input:', input, 'Raw LLM response:', rawText
      );
      // Fallback to empty array if generation fails
      return { questions: [] };
    }
    // Ensure all questions have the targetQuestionStyle (sometimes LLM might miss it despite instructions)
     const validatedQuestions = output.questions.map(q => ({
      ...q,
      questionStyle: input.targetQuestionStyle, 
    })).filter(q => { // Re-validate after forcing style, because options/index might mismatch
        if (q.questionStyle === 'cespe') {
            return q.options.length === 2 && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 2;
        }
        if (q.questionStyle === 'mcq4') {
            return q.options.length === 4 && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4;
        }
        if (q.questionStyle === 'mcq5') {
            return q.options.length === 5 && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 5;
        }
        return false;
    });


    if (validatedQuestions.length !== output.questions.length) {
        console.warn('findSimulatedExternalQuestionsFlow: Some simulated questions were filtered out due to style/options mismatch after generation. Initial count:', output.questions.length, 'Final count:', validatedQuestions.length);
    }
    
    return { questions: validatedQuestions };
  }
);

