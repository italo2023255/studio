'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating answers with explanations based on a legal text.
 *
 * - generateAnswersWithExplanations - A function that generates multiple-choice questions, answer keys, and explanations.
 * - GenerateAnswersWithExplanationsInput - The input type for the generateAnswersWithExplanations function.
 * - GenerateAnswersWithExplanationsOutput - The return type for the generateAnswersWithExplanations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAnswersWithExplanationsInputSchema = z.object({
  legalText: z.string().describe('The legal text to generate questions and answers from.'),
  question: z.string().describe('The question to generate answers for.'),
  numAlternatives: z.number().describe('The number of multiple-choice alternatives to generate.'),
});

export type GenerateAnswersWithExplanationsInput = z.infer<
  typeof GenerateAnswersWithExplanationsInputSchema
>;

const GenerateAnswersWithExplanationsOutputSchema = z.object({
  correctAnswer: z.string().describe('The correct answer to the question.'),
  explanation: z
    .string()
    .describe('A detailed explanation of the correct answer, referencing the legal text.'),
});

export type GenerateAnswersWithExplanationsOutput = z.infer<
  typeof GenerateAnswersWithExplanationsOutputSchema
>;

export async function generateAnswersWithExplanations(
  input: GenerateAnswersWithExplanationsInput
): Promise<GenerateAnswersWithExplanationsOutput> {
  return generateAnswersWithExplanationsFlow(input);
}

const generateAnswersWithExplanationsPrompt = ai.definePrompt({
  name: 'generateAnswersWithExplanationsPrompt',
  input: {schema: GenerateAnswersWithExplanationsInputSchema},
  output: {schema: GenerateAnswersWithExplanationsOutputSchema},
  prompt: `Given the following legal text and question, generate the correct answer and a detailed explanation referencing the legal text.

Legal Text: {{{legalText}}}

Question: {{{question}}}

Correct Answer:
Explanation:`, // Removed Handlebars anti-patterns.
});

const generateAnswersWithExplanationsFlow = ai.defineFlow(
  {
    name: 'generateAnswersWithExplanationsFlow',
    inputSchema: GenerateAnswersWithExplanationsInputSchema,
    outputSchema: GenerateAnswersWithExplanationsOutputSchema,
  },
  async input => {
    const {output} = await generateAnswersWithExplanationsPrompt(input);
    return output!;
  }
);
