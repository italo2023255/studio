
'use server';

/**
 * @fileOverview Generates multiple-choice questions from legal text.
 *
 * - generateQuestions - A function that generates multiple-choice questions from legal text.
 * - GenerateQuestionsInput - The input type for the generateQuestions function.
 * - GenerateQuestionsOutput - The return type for the generateQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuestionsInputSchema = z.object({
  legalText: z.string().describe('The legal text to generate questions from.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The multiple choice question.'),
      options: z.array(z.string()).length(4).describe('Four answer options.'),
      correctAnswerIndex: z.number().int().min(0).max(3).describe('Index of the correct answer (0-3).'),
      explanation: z.string().describe('Explanation of why the answer is correct, referencing the legal text.'),
      mnemonic: z.string().optional().describe('A mnemonic device, trick, or memory aid related to the question.'),
      searchLinks: z.array(z.string()).optional().describe('Links to external resources providing further context.'),
    })
  ).describe('An array of multiple choice questions.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}

const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: {schema: GenerateQuestionsInputSchema},
  output: {schema: GenerateQuestionsOutputSchema},
  prompt: `You are a legal expert who generates multiple-choice questions from legal texts.

Based on the following legal text, generate multiple-choice questions.
Each question must have:
1.  A "question" field (string): The multiple-choice question itself.
2.  An "options" field (array of 4 strings): Four distinct answer choices.
3.  A "correctAnswerIndex" field (number, 0-3): The 0-based index of the correct option in the "options" array.
4.  An "explanation" field (string): A clear explanation of why the chosen answer is correct, referencing the provided legal text.
5.  Optionally, a "mnemonic" field (string): A mnemonic device, trick, or memory aid related to the question.
6.  Optionally, a "searchLinks" field (array of strings): Links to external resources providing further context.

Return a single JSON object with a "questions" key. The value of this key should be an array of question objects, each conforming to the structure described above.

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
    const result = await generateQuestionsPrompt(input); // Get the full result object
    const output = result.output; // Access the parsed output
    const rawText = result.text; // Access the raw text from the LLM

    if (!output) {
      console.error(
        'generateQuestionsFlow: LLM output failed to parse or was empty. Input:',
        input,
        'Raw LLM response text:',
        rawText
      );
      // Throw an error that can be caught by the client-side try/catch block
      throw new Error(
        'A IA falhou ao gerar as questões no formato esperado. Por favor, tente um texto diferente ou tente novamente.'
      );
    }
    return output;
  }
);

