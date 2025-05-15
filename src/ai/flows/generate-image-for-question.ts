
'use server';
/**
 * @fileOverview Generates a conceptual image related to a legal question or cited article.
 *
 * - generateImageForQuestion - A function that generates an image.
 * - GenerateImageForQuestionInput - The input type for the generateImageForQuestion function.
 * - GenerateImageForQuestionOutput - The return type for the generateImageForQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageForQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s original legal question.'),
  // correctAnswerText is now the cited article or main explanation
  correctAnswerText: z.string().describe('The core legal text or explanation that answers the question (e.g., the cited article).'),
  legalConcept: z.string().optional().describe('A key legal concept (e.g., "Habeas Corpus", "Due Process") to guide image generation.')
});
export type GenerateImageForQuestionInput = z.infer<typeof GenerateImageForQuestionInputSchema>;

const GenerateImageForQuestionOutputSchema = z.object({
  imageDataUri: z.string().url().nullable().describe("The generated image as a data URI (e.g., 'data:image/png;base64,...'). Null if image generation fails or is not applicable."),
});
export type GenerateImageForQuestionOutput = z.infer<typeof GenerateImageForQuestionOutputSchema>;

export async function generateImageForQuestion(input: GenerateImageForQuestionInput): Promise<GenerateImageForQuestionOutput> {
  return generateImageForQuestionFlow(input);
}

const generateImageForQuestionFlow = ai.defineFlow(
  {
    name: 'generateConceptualImageFlow',
    inputSchema: GenerateImageForQuestionInputSchema,
    outputSchema: GenerateImageForQuestionOutputSchema,
  },
  async (input) => {
    try {
      const imagePrompt = `Generate a simple, clean, professional, and abstract/conceptual image that visually represents the core idea of the following legal concept or text.
      Focus on: "${input.legalConcept || 'conceito jurídico abstrato'}".
      Context: User asked "${input.question}". The relevant legal text/answer is related to "${input.correctAnswerText}".
      The image should be suitable for a legal study application. Avoid text in the image. Create something symbolic or metaphorical.`;

      const {media, text: responseText} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: imagePrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
           safetySettings: [ 
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });

      if (media && media.url) {
        return {imageDataUri: media.url};
      } else {
        console.warn('Image generation did not return media.url. LLM Text Response:', responseText, "Input was:", input);
        return {imageDataUri: null};
      }
    } catch (error) {
      console.error('Error generating conceptual image:', error, "Input was:", input);
      return {imageDataUri: null};
    }
  }
);
