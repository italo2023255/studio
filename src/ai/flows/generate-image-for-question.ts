// src/ai/flows/generate-image-for-question.ts
'use server';
/**
 * @fileOverview Generates an image related to a legal question and its answer.
 *
 * - generateImageForQuestion - A function that generates an image.
 * - GenerateImageForQuestionInput - The input type for the generateImageForQuestion function.
 * - GenerateImageForQuestionOutput - The return type for the generateImageForQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageForQuestionInputSchema = z.object({
  question: z.string().describe('The legal question.'),
  correctAnswerText: z.string().describe('The text of the correct answer to the question.'),
  legalConcept: z.string().optional().describe('A key legal concept derived from the question or answer to help guide image generation, e.g., "Habeas Corpus", "Due Process", "Contract Law".')
});
export type GenerateImageForQuestionInput = z.infer<typeof GenerateImageForQuestionInputSchema>;

const GenerateImageForQuestionOutputSchema = z.object({
  imageDataUri: z.string().nullable().describe("The generated image as a data URI (e.g., 'data:image/png;base64,...'). Null if image generation fails or is not applicable."),
});
export type GenerateImageForQuestionOutput = z.infer<typeof GenerateImageForQuestionOutputSchema>;

export async function generateImageForQuestion(input: GenerateImageForQuestionInput): Promise<GenerateImageForQuestionOutput> {
  return generateImageForQuestionFlow(input);
}

// This flow uses a model capable of image generation.
const generateImageForQuestionFlow = ai.defineFlow(
  {
    name: 'generateImageForQuestionFlow',
    inputSchema: GenerateImageForQuestionInputSchema,
    outputSchema: GenerateImageForQuestionOutputSchema,
  },
  async (input) => {
    try {
      const imagePrompt = `Generate a simple, conceptual, and abstract image that visually represents the core idea of the following legal question and answer. Focus on the concept: ${input.legalConcept || 'legal justice'}. Legal context: Question: "${input.question}", Answer: "${input.correctAnswerText}". The image should be suitable for a quiz application, clean, and professional. Avoid text in the image.`;

      const {media, text: responseText} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Specific model for image generation
        prompt: imagePrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // Must request IMAGE
           safetySettings: [ // Relax safety settings slightly if needed for legal concepts, be cautious
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
      console.error('Error generating image for question:', error, "Input was:", input);
      return {imageDataUri: null}; // Return null if image generation fails
    }
  }
);
