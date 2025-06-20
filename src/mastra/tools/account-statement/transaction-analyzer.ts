import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { TransactionAnalysis, TransactionAnalysisSchema } from './types';
import { generatePromptFromSchema } from './schema-prompt-generator';

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
    console.log('Analyzing transaction:', transactionText);
    
    // Generate prompt from schema
    const schemaPrompt = generatePromptFromSchema(TransactionAnalysisSchema);
    console.log('Generated schema prompt:', schemaPrompt);
    
    const result = await generateObject({
      model: openai(process.env.MODEL ?? "gpt-4o"),
      prompt: `
        You are an expert Hebrew banking transaction analyzer for Israeli financial data.
        
        Analyze this Hebrew transaction text: "${transactionText}"
        
        Extract and return data according to this schema:
        
        ${schemaPrompt}
        
        CRITICAL: The summary MUST be at least 70 characters long. Here's how to achieve this:
        
        For a fashion store transaction like "אופנת טוונט פור סבן 339.80 ₪", create a summary like:
        "רכישה בחנות אופנת טוונט פור סבן בסך 339.80 שקלים, קנייה רגילה של בגדים ואופנה"
        
        Formula for 70+ character summary:
        - Start with transaction type: "רכישה ב..." or "תשלום ל..." or "עסקה ב..."
        - Add merchant name: "חנות X" or "בנק X" or "חברת X"  
        - Add amount: "בסך X שקלים"
        - Add context: "קנייה רגילה של..." or "שירות של..." or "תשלום עבור..."
        
        Count characters carefully - the summary must be 70-200 characters!
      `,
      schema: TransactionAnalysisSchema,
    });

    console.log('AI generated result:', result.object);
    return result.object;
  } catch (error) {
    console.error('=== TRANSACTION ANALYSIS ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    console.error('Input text:', transactionText);
    console.error('Model used:', process.env.MODEL ?? "gpt-4o");
    console.error('================================');
    
    // Fallback response that matches the schema
    return {
      summary: `עסקה בסך ${transactionText.includes('₪') ? transactionText.match(/₪\s*[\d,]+\.?\d*/)?.[0] || '' : ''} - ${transactionText.substring(0, 50)}`,
      transactionType: 'regular' as const,
      category: 'other' as const
    };
  }
}; 