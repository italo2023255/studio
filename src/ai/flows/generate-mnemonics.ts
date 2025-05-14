// src/ai/flows/generate-mnemonics.ts
'use server';
/**
 * @fileOverview Generates mnemonic devices, tricks, and memory aids related to legal questions.
 *
 * - generateMnemonics - A function that generates mnemonics for legal questions.
 * - GenerateMnemonicsInput - The input type for the generateMnemonics function.
 * - GenerateMnemonicsOutput - The return type for the generateMnemonics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMnemonicsInputSchema = z.object({
  legalText: z
    .string()
    .describe('The legal text for which to generate mnemonics.'),
  question: z.string().describe('The legal question related to the legal text.'),
  answer: z.string().describe('The correct answer to the legal question.'),
});
export type GenerateMnemonicsInput = z.infer<typeof GenerateMnemonicsInputSchema>;

const GenerateMnemonicsOutputSchema = z.object({
  mnemonics: z
    .array(z.string())
    .describe('An array of mnemonic devices, tricks, and memory aids.'),
});
export type GenerateMnemonicsOutput = z.infer<typeof GenerateMnemonicsOutputSchema>;

export async function generateMnemonics(input: GenerateMnemonicsInput): Promise<GenerateMnemonicsOutput> {
  return generateMnemonicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMnemonicsPrompt',
  input: {schema: GenerateMnemonicsInputSchema},
  output: {schema: GenerateMnemonicsOutputSchema},
  prompt: `You are an expert in creating mnemonic devices for legal concepts.

  Given the following legal text, question, and answer, generate a list of mnemonic devices, tricks, and memory aids to help the user remember the information.

  Legal Text: {{{legalText}}}
  Question: {{{question}}}
  Answer: {{{answer}}}

  Provide a variety of mnemonics, including acronyms, rhymes, and visual associations. Selectively decide when one mnemonic is more applicable or useful than another depending on the circumstances.
  Each mnemonic should be concise and easy to remember. Return an array of mnemonics.
  `,
});

const generateMnemonicsFlow = ai.defineFlow(
  {
    name: 'generateMnemonicsFlow',
    inputSchema: GenerateMnemonicsInputSchema,
    outputSchema: GenerateMnemonicsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
