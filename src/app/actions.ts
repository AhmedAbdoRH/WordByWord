
"use server";

import { generateWords } from "@/ai/flows/generate-words-flow"; // Import the correct function
import { extractWords } from "@/ai/flows/extract-words-flow"; // Import the correct function

// Re-export or wrap the Genkit flows as Server Actions

export const generateWordsAction = async (input: { difficulty: 'easy' | 'medium' | 'hard'; count: number }) => {
  // Call the imported generateWords function directly
  return await generateWords(input);
};

export const extractWordsAction = async (input: { text: string; count: number }) => {
  // Call the imported extractWords function directly
  return await extractWords(input);
};

// Add any other server-side logic needed by your page here

