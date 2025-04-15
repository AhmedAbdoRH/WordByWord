'use server';

/**
 * @fileOverview An AI agent for generating a list of English words with Arabic translations
 * of a desired difficult level.
 *
 * - generateWords - A function that handles the word generation process.
 * - GenerateWordsInput - The input type for the generateWords function.
 * - GenerateWordsOutput - The return type for the generateWords function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateWordsInputSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the words to generate.'),
  count: z.number().min(1).max(10).default(10).describe('The number of words to generate.'),
});
export type GenerateWordsInput = z.infer<typeof GenerateWordsInputSchema>;

const GenerateWordsOutputSchema = z.array(
  z.object({
    english: z.string().describe('The English word.'),
    arabic: z.string().describe('The Arabic translation of the word.'),
  })
);
export type GenerateWordsOutput = z.infer<typeof GenerateWordsOutputSchema>;

export async function generateWords(input: GenerateWordsInput): Promise<GenerateWordsOutput> {
  return generateWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWordsPrompt',
  input: {
    schema: z.object({
      difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the words to generate.'),
      count: z.number().min(1).max(10).default(10).describe('The number of words to generate.'),
    }),
  },
  output: {
    schema: z.array(
      z.object({
        english: z.string().describe('The English word.'),
        arabic: z.string().describe('The Arabic translation of the word.'),
      })
    ),
  },
  prompt: `You are a helpful assistant that generates a list of common English words and their Arabic translations.
The words should be appropriate for the specified difficulty level.
Return exactly {{count}} words.

Difficulty: {{{difficulty}}}

The output should be a JSON array of objects with "english" and "arabic" keys.  The 'english' key must contain a valid English word that is commonly used. The 'arabic' key must contain the Arabic translation of that word.
`,
});

const generateWordsFlow = ai.defineFlow<
  typeof GenerateWordsInputSchema,
  typeof GenerateWordsOutputSchema
>(
  {
    name: 'generateWordsFlow',
    inputSchema: GenerateWordsInputSchema,
    outputSchema: GenerateWordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
