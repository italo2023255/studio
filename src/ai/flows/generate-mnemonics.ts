
'use server';
/**
 * @fileOverview Generates mnemonic devices, tricks, and memory aids related to legal texts in Brazilian Portuguese.
 * This flow focuses on AI-generated mnemonics based directly on the provided legal text.
 *
 * - generateMnemonics - A function that generates mnemonics for legal texts.
 * - GenerateMnemonicsInput - The input type for the generateMnemonics function.
 * - GenerateMnemonicsOutput - The return type for the generateMnemonics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema expects the specific legal text (article) to base mnemonics on.
const GenerateMnemonicsInputSchema = z.object({
  legalText: z
    .string()
    .describe('O texto legal específico (ex: o artigo de lei identificado) para o qual gerar mnemônicos.'),
  question: z.string().optional().describe('A pergunta original do usuário, para contexto.'),
  answer: z.string().optional().describe('A resposta ou explicação principal, para contexto.'),
});
export type GenerateMnemonicsInput = z.infer<typeof GenerateMnemonicsInputSchema>;

const GenerateMnemonicsOutputSchema = z.object({
  mnemonics: z
    .array(z.string())
    .describe('Um array de dispositivos mnemônicos, "macetes", "bizus" gerados pela IA, em Português do Brasil, focados no legalText fornecido.'),
});
export type GenerateMnemonicsOutput = z.infer<typeof GenerateMnemonicsOutputSchema>;

export async function generateMnemonics(input: GenerateMnemonicsInput): Promise<GenerateMnemonicsOutput> {
  return generateMnemonicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAIMnemonicsPrompt',
  input: {schema: GenerateMnemonicsInputSchema},
  output: {schema: GenerateMnemonicsOutputSchema},
  prompt: `Você é um especialista em criar "macetes" e "bizus" (dispositivos mnemônicos) para conceitos jurídicos em Português do Brasil, baseando-se estritamente no texto legal fornecido.

  Dado o seguinte TEXTO LEGAL PRINCIPAL, gere uma lista de dispositivos mnemônicos para ajudar o usuário a memorizar seus pontos chave.
  Se a pergunta e resposta do usuário forem fornecidas, use-as como CONTEXTO ADICIONAL para direcionar a relevância dos mnemônicos, mas os mnemônicos devem ser derivados do TEXTO LEGAL PRINCIPAL.

  TEXTO LEGAL PRINCIPAL (base para os mnemônicos):
  {{{legalText}}}

  {{#if question}}
  Contexto - Pergunta do Usuário: {{{question}}}
  {{/if}}
  {{#if answer}}
  Contexto - Resposta Principal: {{{answer}}}
  {{/if}}

  Instruções:
  - Crie mnemônicos que ajudem a lembrar dos elementos, requisitos, prazos, ou exceções contidos no TEXTO LEGAL PRINCIPAL.
  - Forneça uma variedade de mnemônicos, incluindo acrônimos, rimas e associações, se aplicável.
  - Cada mnemônico deve ser conciso, fácil de lembrar e em Português do Brasil.
  - Retorne um array de strings contendo os mnemônicos. Se nenhum mnemônico claro ou útil puder ser gerado diretamente do texto legal, retorne um array vazio.
  - Exemplo: Para um artigo com vários incisos importantes, um acrônimo com as palavras-chave de cada inciso.
  `,
});

const generateMnemonicsFlow = ai.defineFlow(
  {
    name: 'generateAIMnemonicsFlow',
    inputSchema: GenerateMnemonicsInputSchema,
    outputSchema: GenerateMnemonicsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.mnemonics) { // Check for mnemonics array specifically
        console.warn('generateAIMnemonicsFlow: LLM output was null, undefined, or did not contain a mnemonics array. Input:', input);
        return { mnemonics: [] };
    }
    return output;
  }
);
