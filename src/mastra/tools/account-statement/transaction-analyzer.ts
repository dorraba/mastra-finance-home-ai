import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject, embed } from 'ai';
import { TransactionAnalysis, TransactionAnalysisSchema } from './types';
import { generatePromptFromSchema } from './schema-prompt-generator';

/**
 * Clean messy transaction text by removing timestamps and normalizing spaces
 */
const cleanTransactionText = (rawText: string): string => {
  return rawText
    .replace(/^.*GMT\+\d{4}\s*\([^)]+\)\s*/, '') // Remove timestamps like "Tue Aug 27 2024 00:00:00 GMT+0300 (Israel Daylight Time)"
    .replace(/\s+/g, ' ')                        // Replace multiple spaces/tabs with single space
    .trim();                                     // Remove leading/trailing whitespace
};

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
    // Clean the input text first
    const cleanedText = cleanTransactionText(transactionText);
    console.log('Original transaction:', transactionText);
    console.log('Cleaned transaction:', cleanedText);
    
    // Generate prompt from schema
    const schemaPrompt = generatePromptFromSchema(TransactionAnalysisSchema);
    console.log('Generated schema prompt:', schemaPrompt);
    
    // First, generate the transaction analysis without embeddings
    const analysisResult = await generateObject({
      model: openai(process.env.MODEL ?? "gpt-4o"),
      prompt: `
        You are an expert Hebrew banking transaction analyzer for Israeli financial data.
        
        Analyze this transaction text: "${cleanedText}"
        
        IMPORTANT: The input may contain messy data like timestamps, mixed languages, or pre-existing categories. 
        IGNORE all timestamps, English dates, and existing categories. Focus ONLY on:
        - Merchant name (in Hebrew)
        - Transaction amount 
        - Transaction nature
        
        Extract and return data according to this schema (ignore embedding fields for now):
        
        ${schemaPrompt}
        
        CRITICAL: Both summaries MUST be at least 70 characters long.
        
        Examples of how to clean messy input:
        
        Input: "Tue Aug 27 2024 00:00:00 GMT+0300 אורבניקה 35 רגילה אופנה"
        Extract: Merchant="אורבניקה", Amount="35", Type="clothing store"
        Hebrew: "רכישה בחנות אורבניקה בסך 35 שקלים, קנייה רגילה של בגדים ואופנה בחנות אורבניקה"
        English: "Purchase at Urbanica store for 35 NIS, regular clothing and fashion shopping at Urbanica"
        
        Input: "עירית נתניה הוראת קבע 942.55"
        Extract: Merchant="עירית נתניה", Amount="942.55", Type="municipality payment"
        Hebrew: "תשלום חודשי לעירית נתניה בסך 942.55 שקלים, הוראת קבע עבור מסים ותשלומי חובה"
        English: "Monthly payment to Netanya Municipality for 942.55 NIS, standing order for taxes and mandatory payments"
        
        Formula for 70+ character summaries:
        Hebrew: "רכישה ב[merchant] בסך [amount] שקלים, [context] עבור [category type]"
        English: "Purchase at [merchant] for [amount] NIS, [context] for [category type]"
        
        IGNORE: timestamps, existing categories, English dates, GMT references
        FOCUS: merchant name, amount, transaction nature
        CREATE: proper Hebrew and English summaries (70-200 chars each)
      `,
      schema: z.object({
        summary: z.string().min(70).max(200),
        englishSummary: z.string().min(70).max(200),
        transactionType: TransactionAnalysisSchema.shape.transactionType,
        category: TransactionAnalysisSchema.shape.category
      }),
    });

    console.log('AI generated analysis:', analysisResult.object);

    // Generate embeddings for both summaries
    console.log('Generating embeddings...');
    
    const [hebrewEmbeddingResult, englishEmbeddingResult] = await Promise.all([
      embed({
        model: openai.embedding('text-embedding-ada-002'),
        value: analysisResult.object.summary,
      }),
      embed({
        model: openai.embedding('text-embedding-ada-002'),
        value: analysisResult.object.englishSummary,
      })
    ]);

    console.log('Embeddings generated successfully');

    // Combine analysis with embeddings
    const finalResult: TransactionAnalysis = {
      ...analysisResult.object,
      summaryEmbedding: hebrewEmbeddingResult.embedding,
      englishSummaryEmbedding: englishEmbeddingResult.embedding
    };

    console.log('Final result with embeddings ready');
    return finalResult;

  } catch (error) {
    console.error('=== TRANSACTION ANALYSIS ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    console.error('Input text:', transactionText);
    console.error('Model used:', process.env.MODEL ?? "gpt-4o");
    console.error('================================');
    
    // Fallback response that matches the schema (with dummy embeddings)
    const dummyEmbedding = new Array(1536).fill(0);
    
    return {
      summary: `עסקה בסך ${transactionText.includes('₪') ? transactionText.match(/₪\s*[\d,]+\.?\d*/)?.[0] || '' : ''} - ${transactionText.substring(0, 50)}`,
      englishSummary: `Transaction for ${transactionText.includes('₪') ? transactionText.match(/₪\s*[\d,]+\.?\d*/)?.[0] || '' : ''} - ${transactionText.substring(0, 50)}`,
      summaryEmbedding: dummyEmbedding,
      englishSummaryEmbedding: dummyEmbedding,
      transactionType: 'regular' as const,
      category: 'other' as const
    };
  }
}; 