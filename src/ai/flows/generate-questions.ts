
'use server';

/**
 * @fileOverview Generates multiple-choice or true/false questions from legal text.
 * THIS FLOW IS LIKELY DEPRECATED OR NEEDS REVISION due to the app's shift
 * towards answering user questions directly rather than generating quizzes from provided text.
 *
 * - generateQuestions - A function that generates questions from legal text based on style and quantity.
 * - GenerateQuestionsInput - The input type for the generateQuestions function.
 * - GenerateQuestionsOutput - The return type for the generateQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { QuestionStyle } from '@/types';

const GenerateQuestionsInputSchema = z.object({
  legalText: z.string().describe('The legal text to generate questions from.'),
  numQuestions: z.number().int().min(1).max(10).describe('The number of questions to generate (1-10).'),
  questionStyle: z.enum(['cespe', 'mcq4', 'mcq5']).describe('The style of the questions: "cespe" (True/False), "mcq4" (4 multiple choice options), "mcq5" (5 multiple choice options).'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const QuestionObjectSchema = z.object({
    question: z.string().describe('The question text or affirmative statement for Cespe style.'),
    options: z.array(z.string()).describe('Answer options. For "cespe", this will be ["Certo", "Errado"]. For "mcq4", 4 options. For "mcq5", 5 options. Options should contain only the text, without prefixes like "A)", "B)".'),
    correctAnswerIndex: z.number().int().min(0).describe('Index of the correct answer in the options array (0-1 for Cespe, 0-3 for mcq4, 0-4 for mcq5).'),
    explanation: z.string().describe('Explanation of why the answer is correct, referencing the legal text strictly (letra da lei).'),
    questionStyle: z.enum(['cespe', 'mcq4', 'mcq5']).describe('The style of the question generated.'),
    mnemonic: z.string().optional().describe('A mnemonic device, trick, or memory aid related to the question.'),
    searchLinks: z.array(z.string()).optional().describe('Links to external resources providing further context.'),
  })
  .refine(
    (data) => {
      if (data.questionStyle === 'cespe') {
        return data.options.length === 2 && data.correctAnswerIndex <= 1 && (data.options[0].toLowerCase() === "certo" || data.options[0].toLowerCase() === "errado") && (data.options[1].toLowerCase() === "certo" || data.options[1].toLowerCase() === "errado");
      }
      if (data.questionStyle === 'mcq4') {
        return data.options.length === 4 && data.correctAnswerIndex <= 3;
      }
      if (data.questionStyle === 'mcq5') {
        return data.options.length === 5 && data.correctAnswerIndex <= 4;
      }
      return false; 
    },
    {
      message: 'Options length, content, or correctAnswerIndex is inconsistent with questionStyle.',
    }
  );


const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionObjectSchema).describe('An array of question objects.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  console.warn("generateQuestions flow is likely deprecated due to app functionality shift. Consider removing or refactoring.");
  return generateQuestionsFlow(input);
}

const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateQuestionsPrompt_DEPRECATED', // Renamed to indicate potential deprecation
  input: {schema: GenerateQuestionsInputSchema},
  output: {schema: GenerateQuestionsOutputSchema},
  prompt: `You are a legal expert tasked with creating questions from legal texts based on specific styles.
Generate {{numQuestions}} question(s) from the provided legal text, adhering to the specified '{{questionStyle}}'.
The entire response MUST be a single JSON object with a "questions" key, and its value must be an array of question objects. Each question object in the array must conform to the schema.

Instructions for each question style:
(Instructions remain the same but this prompt might not be called anymore)
1.  If 'questionStyle' is 'cespe': (Certo/Errado) ...
2.  If 'questionStyle' is 'mcq4': (4 options) ...
3.  If 'questionStyle' is 'mcq5': (5 options) ...

Legal Text:
{{{legalText}}}`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow_DEPRECATED', // Renamed
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async (input) => {
    const result = await generateQuestionsPrompt(input);
    const output = result.output;
    const rawText = result.text;

    if (!output || !output.questions || output.questions.length === 0) {
      console.error(
        'generateQuestionsFlow_DEPRECATED: LLM output failed. Input:',
        input,
        'Raw LLM response text:',
        rawText
      );
      throw new Error(
        'A IA falhou ao gerar as questões no formato esperado (Fluxo Deprecado).'
      );
    }
    for (const q of output.questions) {
      if (q.questionStyle !== input.questionStyle) {
        console.warn(
          `generateQuestionsFlow_DEPRECATED: Mismatch in questionStyle. Expected ${input.questionStyle}, got ${q.questionStyle} for question: ${q.question}.`
        );
      }
    }
    return output;
  }
);
