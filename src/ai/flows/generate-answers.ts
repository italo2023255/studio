
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating answers with explanations based on a legal text.
 * THIS FLOW IS LIKELY DEPRECATED or its logic merged into 'answer-legal-question.ts'.
 * The new primary flow directly generates explanations based on the user's question and identified article.
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
  numAlternatives: z.number().optional().describe('The number of multiple-choice alternatives (contextual, may not be used).'),
});

export type GenerateAnswersWithExplanationsInput = z.infer<
  typeof GenerateAnswersWithExplanationsInputSchema
>;

const GenerateAnswersWithExplanationsOutputSchema = z.object({
  correctAnswer: z.string().describe('The correct answer to the question. This should be the text of the correct option.'),
  explanation: z
    .string()
    .describe('A detailed explanation of why the provided answer is correct, referencing the legal text strictly (letra da lei).'),
});

export type GenerateAnswersWithExplanationsOutput = z.infer<
  typeof GenerateAnswersWithExplanationsOutputSchema
>;

export async function generateAnswersWithExplanations(
  input: GenerateAnswersWithExplanationsInput
): Promise<GenerateAnswersWithExplanationsOutput> {
  console.warn("generateAnswersWithExplanations flow is likely deprecated. Explanations are now generated within answer-legal-question.ts flow.");
  return generateAnswersWithExplanationsFlow(input);
}

const generateAnswersWithExplanationsPrompt = ai.definePrompt({
  name: 'generateAnswersWithExplanationsPrompt_DEPRECATED',
  input: {schema: GenerateAnswersWithExplanationsInputSchema},
  output: {schema: GenerateAnswersWithExplanationsOutputSchema},
  prompt: `Given the following legal text and question, identify the correct answer and provide a detailed explanation strictly referencing the legal text ("letra da lei").
(This prompt is likely deprecated)
Legal Text:
{{{legalText}}}

Question:
{{{question}}}

Focus on providing the text of the correct answer for the 'correctAnswer' field and a comprehensive explanation for the 'explanation' field.
The output must be a JSON object with "correctAnswer" and "explanation" keys.`,
});

const generateAnswersWithExplanationsFlow = ai.defineFlow(
  {
    name: 'generateAnswersWithExplanationsFlow_DEPRECATED',
    inputSchema: GenerateAnswersWithExplanationsInputSchema,
    outputSchema: GenerateAnswersWithExplanationsOutputSchema,
  },
  async (input) => {
    const {output, text: rawText} = await generateAnswersWithExplanationsPrompt(input);
     if (!output || !output.correctAnswer || !output.explanation) {
      console.error(
        'generateAnswersWithExplanationsFlow_DEPRECATED: LLM output failed. Input:',
        input,
        'Raw LLM response text:',
        rawText
      );
      throw new Error(
        'A IA falhou ao gerar a explicação da resposta (Fluxo Deprecado).'
      );
    }
    return output;
  }
);
