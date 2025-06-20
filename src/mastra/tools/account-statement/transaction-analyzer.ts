import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { TransactionAnalysis, TransactionAnalysisSchema } from './types';

export const transactionAnalyzerTool = createTool({
  id: 'analyze-transaction',
  description: 'Analyze Hebrew banking transactions to extract embedding-optimized summaries, classify transaction types, and categorize based on Israeli merchant patterns for comprehensive financial tracking',
  inputSchema: z.object({
    transactionText: z.string()
      .min(5, 'Transaction text must contain meaningful content')
      .describe('Single Hebrew transaction text from bank statement including merchant name, amount, date, and transaction details for comprehensive analysis'),
  }),
  outputSchema: TransactionAnalysisSchema,
  execute: async ({ context }) => {
    return await analyzeTransaction(context.transactionText);
  },
});

const analyzeTransaction = async (transactionText: string): Promise<TransactionAnalysis> => {
  try {
    const result = await generateObject({
      model: openai(process.env.MODEL ?? "gpt-4o"),
      prompt: `
        You are an expert Hebrew banking transaction analyzer for Israeli financial data.
        
        Analyze this Hebrew transaction: "${transactionText}"
        
        Return a JSON object with exactly these fields:
        
        1. **summary**: Hebrew text (70-200 chars) with merchant name, amount, and transaction nature
        2. **transactionType**: Choose from "regular", "monthly", or "credit" based on payment pattern
        3. **category**: Choose the most appropriate category based on merchant and transaction type
        
        For "הוראת קבע" (standing order) transactions, use "monthly" type.
        For municipality payments (עירית), use "mandatory_payments" category.
        
        The schema will validate your response and provide detailed descriptions for each field.
      `,
      schema: TransactionAnalysisSchema,
    });

    return result.object;
  } catch (error) {
    console.error('Transaction analysis error:', error);
    console.error('Input text:', transactionText);
    
    // Fallback response that matches the schema
    return {
      summary: `עסקה: ${transactionText.substring(0, 100)}`,
      transactionType: 'regular' as const,
      category: 'other' as const
    };
  }
}; 