
'use server';

/**
 * @fileOverview Generates multiple-choice or true/false questions from legal text.
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
      return false; // Should not happen if questionStyle is one of the enum values
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
  return generateQuestionsFlow(input);
}

const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: {schema: GenerateQuestionsInputSchema},
  output: {schema: GenerateQuestionsOutputSchema},
  prompt: `You are a legal expert tasked with creating questions from legal texts based on specific styles.
Generate {{numQuestions}} question(s) from the provided legal text, adhering to the specified '{{questionStyle}}'.
The entire response MUST be a single JSON object with a "questions" key, and its value must be an array of question objects. Each question object in the array must conform to the schema.

Instructions for each question style:

1.  If 'questionStyle' is 'cespe':
    *   Formulate an affirmative statement derived directly from the legal text. This statement will be the "question".
    *   The "options" array MUST be exactly ["Certo", "Errado"]. Ensure these exact strings (case-insensitive matching for "Certo" and "Errado" is acceptable for the values, e.g., ["certo", "errado"] or ["Certo", "Errado"], but the semantic meaning must be preserved).
    *   "correctAnswerIndex" must be 0 if the statement is "Certo" (factually correct according to the legal text) or 1 if the statement is "Errado" (factually incorrect).
    *   The "explanation" must clarify why the statement is Certo or Errado, strictly referencing the "letra da lei" (the exact wording/provisions) of the provided legal text.
    *   The "questionStyle" field in EACH output question object MUST be "cespe".

2.  If 'questionStyle' is 'mcq4':
    *   Create a multiple-choice question with four distinct answer choices.
    *   The "options" array MUST contain these 4 string options. The option strings should contain ONLY the option text, do NOT include prefixes like 'A)', 'B)', 'C)', 'D)' in the strings themselves.
    *   "correctAnswerIndex" must be a number from 0 to 3, corresponding to the correct option.
    *   The "explanation" must detail why the selected answer is correct, strictly referencing the "letra da lei".
    *   The "questionStyle" field in EACH output question object MUST be "mcq4".

3.  If 'questionStyle' is 'mcq5':
    *   Create a multiple-choice question with five distinct answer choices.
    *   The "options" array MUST contain these 5 string options. The option strings should contain ONLY the option text, do NOT include prefixes like 'A)', 'B)', 'C)', 'D)', 'E)' in the strings themselves.
    *   "correctAnswerIndex" must be a number from 0 to 4.
    *   The "explanation" must detail why the selected answer is correct, strictly referencing the "letra da lei".
    *   The "questionStyle" field in EACH output question object MUST be "mcq5".

For ALL questions:
*   Each generated question object MUST include all required fields as per the schema, especially the "questionStyle" field, matching the requested '{{questionStyle}}'.
*   You may optionally include a "mnemonic" (string) and/or "searchLinks" (array of strings) for any question.

Legal Text:
{{{legalText}}}`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async input => {
    const result = await generateQuestionsPrompt(input);
    const output = result.output; // Access the parsed output directly
    const rawText = result.text; // Access the raw text response

    if (!output || !output.questions || output.questions.length === 0) {
      console.error(
        'generateQuestionsFlow: LLM output failed to parse (Zod validation likely failed), was empty, or did not contain questions. Input:',
        input,
        'Raw LLM response text:',
        rawText
      );
      throw new Error(
        'A IA falhou ao gerar as questões no formato esperado ou não gerou questões. Por favor, tente um texto legal diferente, ajuste o número de questões ou tente novamente. Verifique o console do servidor para a resposta bruta da IA, se disponível.'
      );
    }
     // Double-check questionStyle consistency if not fully covered by Zod refine for each item
    for (const q of output.questions) {
      if (q.questionStyle !== input.questionStyle) {
        console.warn(
          `generateQuestionsFlow: Mismatch in questionStyle. Expected ${input.questionStyle}, got ${q.questionStyle} for question: ${q.question}. Raw LLM response text:`, rawText
        );
        // This could indicate a partial adherence by the LLM.
        // Depending on strictness, one might throw an error here or attempt to correct.
        // For now, we log and let it pass if the main Zod validation passed overall.
      }
    }
    return output;
  }
);
