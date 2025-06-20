import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { CreditCardData, CreditCardDataSchema } from './types';

export const creditCardDataExtractorTool = createTool({
  id: 'extract-credit-card-data',
  description: 'Extract and validate general data from Hebrew credit card or bank account statements including card digits, account numbers, dates, and amounts',
  inputSchema: z.object({
    csvText: z.string()
      .min(10, 'CSV text must contain meaningful content')
      .describe('Hebrew CSV text content of the bank statement containing transaction details, account information, and amounts'),
  }),
  outputSchema: CreditCardDataSchema,
  execute: async ({ context }) => {
    return await extractCreditCardData(context.csvText);
  },
});

const extractCreditCardData = async (csvText: string): Promise<CreditCardData> => {
  const result = await generateObject({
    model: openai(process.env.MODEL ?? "gpt-4o"),
    prompt: `
      You are a specialized Hebrew banking statement analyzer. Extract the following critical information from this Hebrew bank statement text with high accuracy:

      Hebrew Banking Text to Analyze:
      "${csvText}"

      EXTRACTION REQUIREMENTS:

      1. **Credit Card Last 4 Digits**: 
         - Look for Hebrew patterns like "המסתיים ב-4357" (ending with 4357)
         - Also check for "מסתיים ב-" or similar Hebrew phrases
         - Return exactly 4 digits only

      2. **Bank Account Number**: 
         - Look for patterns like "לחשבון מזרחי-טפחות 577-181036"
         - Extract the numeric part only (remove hyphens, spaces, bank names)
         - Common Israeli banks: מזרחי-טפחות, בנק לאומי, בנק הפועלים, בנק דיסקונט

      3. **Statement Date**: 
         - Find dates in Hebrew context, typically in DD/MM/YYYY format
         - Look for context clues like "עסקאות לחיוב ב-" followed by date

      4. **Total Amount**: 
         - Look for monetary amounts with ₪ (shekel) symbol
         - Parse amounts with comma separators (e.g., "11,282.47")
         - Extract numeric value only, convert to proper decimal format

      CRITICAL: Return data in exact schema format with proper validation.
    `,
    schema: CreditCardDataSchema,
  });

  return result.object;
}; 