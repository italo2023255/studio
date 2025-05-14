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
  enhancedAnswer: z.string().describe('The enhanced answer with internet search results and reasoning based on legal texts/precedents found.'),
  searchLinks: z.array(z.string()).describe('The links to jurisprudence sites, legal blogs, or relevant video resources (e.g., YouTube explainer videos).'),
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
    description: 'Searches the internet for relevant information about the legal answer, including jurisprudence, legal articles, and explanatory videos.',
    inputSchema: z.object({
      query: z.string().describe('The query to search for on the internet. Should be specific to the legal question and answer.'),
    }),
    outputSchema: z.array(
        z.object({
            title: z.string().describe("Title of the search result."),
            link: z.string().url().describe("URL of the search result."),
            snippet: z.string().describe("A brief summary of the search result content.")
        })
    ).describe('A list of relevant search results, each containing a title, link, and snippet.'),
  },
  async input => {
    // Placeholder implementation for internet search.
    // In a real application, this would use a search API (e.g., Google Custom Search API).
    console.log(`Simulating internet search for: ${input.query}`);
    // Simulate finding a mix of articles and video links
    return [
      {
        title: `Jurisprudence on: ${input.query}`,
        link: `https://juris.example.com/search?q=${encodeURIComponent(input.query)}`,
        snippet: `Detailed jurisprudential analysis related to ${input.query}. This document provides a comprehensive overview...`
      },
      {
        title: `Legal Blog Post: Understanding ${input.query}`,
        link: `https://legalblog.com/?s=${encodeURIComponent(input.query)}`,
        snippet: `An insightful blog post explaining the nuances of ${input.query} with practical examples and case studies.`
      },
      {
        title: `Video Explainer: ${input.query} Demystified`,
        link: `https://www.youtube.com/results?search_query=${encodeURIComponent(input.query + " explainer video legal")}`,
        snippet: `A video that breaks down ${input.query}, making it easier to understand for students and professionals.`
      }
    ];
  }
);

const prompt = ai.definePrompt({
  name: 'enhanceAnswerWithInternetSearchPrompt',
  tools: [searchInternet],
  input: {schema: EnhanceAnswerWithInternetSearchInputSchema},
  output: {schema: EnhanceAnswerWithInternetSearchOutputSchema},
  prompt: `You are an AI assistant specialized in Brazilian law. Your task is to enhance a given legal answer by incorporating information found on the internet.

  Given the legal text, question, and the correct answer, use the 'searchInternet' tool to find relevant jurisprudence, legal articles, and potentially explanatory video links that can:
  1. Corroborate or expand upon the provided answer.
  2. Offer deeper legal insights or precedents related to the question.
  3. Provide links to useful external resources.

  Legal Text (original context):
  {{{legalText}}}

  Question:
  {{{question}}}

  Correct Answer (to be enhanced):
  {{{answer}}}

  Instructions:
  - Use the 'searchInternet' tool with a targeted query based on the question and answer.
  - Analyze the search results.
  - Formulate an 'enhancedAnswer' that integrates the most relevant findings. This enhanced answer should still be grounded in legal accuracy and, where possible, reference the "letra da lei" or established legal doctrine/jurisprudence found.
  - Compile a list of 'searchLinks' containing the URLs of the most useful resources you found and used, including articles and any relevant video links.
  - Ensure the enhanced explanation is sound, refers to legal precedent if found, and provides useful context for a law student.
  - The output must be a JSON object with "enhancedAnswer" and "searchLinks" keys.
  `,
});

const enhanceAnswerWithInternetSearchFlow = ai.defineFlow(
  {
    name: 'enhanceAnswerWithInternetSearchFlow',
    inputSchema: EnhanceAnswerWithInternetSearchInputSchema,
    outputSchema: EnhanceAnswerWithInternetSearchOutputSchema,
  },
  async input => {
    const {output, text: rawText} = await prompt(input);
     if (!output || !output.enhancedAnswer) {
      console.error(
        'enhanceAnswerWithInternetSearchFlow: LLM output failed to parse or was incomplete. Input:',
        input,
        'Raw LLM response text:',
        rawText
      );
      // Fallback to a simpler response if enhancement fails
      return {
        enhancedAnswer: `A explicação para esta questão é baseada diretamente no texto legal fornecido. Para informações adicionais, recomenda-se a pesquisa em fontes jurídicas confiáveis.`,
        searchLinks: []
      };
    }
    return output;
  }
);
