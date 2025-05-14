// Enhance answers with internet search results and links.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceAnswerWithInternetSearchInputSchema = z.object({
  legalText: z.string().describe('The legal text to generate questions from.'),
  question: z.string().describe('The question generated from the legal text.'),
  answer: z.string().describe('The generated answer to the question.'),
});
export type EnhanceAnswerWithInternetSearchInput =
  z.infer<typeof EnhanceAnswerWithInternetSearchInputSchema>;

const EnhanceAnswerWithInternetSearchOutputSchema = z.object({
  enhancedAnswer: z.string().describe('The enhanced answer with internet search results.'),
  searchLinks: z.array(z.string()).describe('The links to jurisprudence sites or legal blogs.'),
});
export type EnhanceAnswerWithInternetSearchOutput =
  z.infer<typeof EnhanceAnswerWithInternetSearchOutputSchema>;

export async function enhanceAnswerWithInternetSearch(
  input: EnhanceAnswerWithInternetSearchInput
): Promise<EnhanceAnswerWithInternetSearchOutput> {
  return enhanceAnswerWithInternetSearchFlow(input);
}

const searchInternet = ai.defineTool(
  {
    name: 'searchInternet',
    description: 'Searches the internet for relevant information about the legal answer.',
    inputSchema: z.object({
      query: z.string().describe('The query to search for on the internet.'),
    }),
    outputSchema: z.array(z.string()).describe('A list of relevant URLs from the search results.'),
  },
  async input => {
    // Placeholder implementation for internet search.
    // In a real application, this would use a search API.
    console.log(`Simulating internet search for: ${input.query}`);
    return [
      `https://example.com/search?q=${input.query}`,
      `https://legalblog.com/?s=${input.query}`,
    ];
  }
);

const prompt = ai.definePrompt({
  name: 'enhanceAnswerWithInternetSearchPrompt',
  tools: [searchInternet],
  input: {schema: EnhanceAnswerWithInternetSearchInputSchema},
  output: {schema: EnhanceAnswerWithInternetSearchOutputSchema},
  prompt: `You are an AI assistant that enhances legal answers with information found on the internet.

  Given the legal text, question, and answer, use the searchInternet tool to find relevant information to improve the answer.

  Legal Text: {{{legalText}}}
  Question: {{{question}}}
  Answer: {{{answer}}}

  Use the searchInternet tool with a query that combines the question and answer to find relevant information. Return the enhanced answer and the links used.

  Make sure that the answer is legally sound and follows precedent as best as possible.
  `,
});

const enhanceAnswerWithInternetSearchFlow = ai.defineFlow(
  {
    name: 'enhanceAnswerWithInternetSearchFlow',
    inputSchema: EnhanceAnswerWithInternetSearchInputSchema,
    outputSchema: EnhanceAnswerWithInternetSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
