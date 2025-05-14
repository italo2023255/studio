// src/ai/flows/generate-mnemonics.ts
'use server';
/**
 * @fileOverview Generates mnemonic devices, tricks, and memory aids related to legal questions in Brazilian Portuguese.
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
    .describe('An array of mnemonic devices, "macetes", "bizus", and memory aids in Brazilian Portuguese.'),
});
export type GenerateMnemonicsOutput = z.infer<typeof GenerateMnemonicsOutputSchema>;

export async function generateMnemonics(input: GenerateMnemonicsInput): Promise<GenerateMnemonicsOutput> {
  return generateMnemonicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMnemonicsPrompt',
  input: {schema: GenerateMnemonicsInputSchema},
  output: {schema: GenerateMnemonicsOutputSchema},
  prompt: `Você é um especialista em criar "macetes" e "bizus" (dispositivos mnemônicos) para conceitos jurídicos em Português do Brasil.

  Dado o seguinte texto legal, pergunta e resposta, gere uma lista de dispositivos mnemônicos, truques e auxílios de memória para ajudar o usuário a lembrar da informação.

  Texto Legal: {{{legalText}}}
  Pergunta: {{{question}}}
  Resposta Correta: {{{answer}}}

  Forneça uma variedade de mnemônicos, incluindo acrônimos, rimas e associações visuais, se aplicável.
  Decida seletivamente quando um mnemônico é mais aplicável ou útil do que outro, dependendo das circunstâncias.
  Cada mnemônico deve ser conciso, fácil de lembrar e em Português do Brasil.
  Retorne um array de strings contendo os mnemônicos. Se nenhum mnemônico claro ou útil puder ser gerado, retorne um array vazio.
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
    if (!output) {
        console.warn('generateMnemonicsFlow: LLM output was null or undefined. Input:', input);
        return { mnemonics: [] };
    }
    return output;
  }
);
