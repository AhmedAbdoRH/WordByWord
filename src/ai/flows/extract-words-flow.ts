
'use server';

/**
 * @fileOverview An AI agent for extracting difficult English words and their Arabic translations from a given text.
 *
 * - extractWords - A function that handles the word extraction process.
 * - ExtractWordsInput - The input type for the extractWords function.
 * - ExtractWordsOutput - The return type for the extractWords function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const ExtractWordsInputSchema = z.object({
  text: z.string().describe('The long text from which to extract difficult words.'),
  count: z.number().min(1).max(20).default(10).describe('The approximate number of difficult words to extract.'),
});
export type ExtractWordsInput = z.infer<typeof ExtractWordsInputSchema>;

const ExtractWordsOutputSchema = z.array(
  z.object({
    english: z.string().describe('The difficult English word extracted from the text.'),
    arabic: z.string().describe('The Arabic translation of the English word.'),
  })
).describe('An array of difficult words and their translations.');
export type ExtractWordsOutput = z.infer<typeof ExtractWordsOutputSchema>;

export async function extractWords(input: ExtractWordsInput): Promise<ExtractWordsOutput> {
  return extractWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractWordsPrompt',
  input: {
    schema: ExtractWordsInputSchema,
  },
  output: {
    schema: ExtractWordsOutputSchema,
  },
  prompt: `Analyze the following text and identify approximately {{count}} difficult English words suitable for an intermediate to advanced English language learner.
For each difficult word identified, provide its Arabic translation.
Return the results as a JSON array of objects, where each object has an "english" key (the difficult word) and an "arabic" key (its Arabic translation).

Text:
{{{text}}}

Focus on words that are less common or might pose a challenge to someone learning English. Ensure the Arabic translation is accurate.
`,
});

const extractWordsFlow = ai.defineFlow<
  typeof ExtractWordsInputSchema,
  typeof ExtractWordsOutputSchema
>(
  {
    name: 'extractWordsFlow',
    inputSchema: ExtractWordsInputSchema,
    outputSchema: ExtractWordsOutputSchema,
  },
  async (input) => {
    // Ensure the text is not excessively long to avoid hitting model limits easily
    const truncatedText = input.text.length > 5000 ? input.text.substring(0, 5000) + '...' : input.text;

    const { output } = await prompt({ ...input, text: truncatedText });
    return output!;
  }
);
