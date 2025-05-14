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

  Based on the following legal text, generate multiple-choice questions with 4 answer options, a correct answer, and an explanation.
  Also generate mnemonic devices and links to external resources when possible. Return it as a JSON array.

  Legal Text:
  {{legalText}}`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async input => {
    const {output} = await generateQuestionsPrompt(input);
    return output!;
  }
);
