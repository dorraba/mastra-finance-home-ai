import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject, embedMany } from 'ai';
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
        
        CRITICAL: Both summaries MUST be at least 50 characters long and descriptive.
        
        Examples of how to clean messy input:
        
        Input: "Tue Aug 27 2024 00:00:00 GMT+0300 אורבניקה 35 רגילה אופנה"
        Extract: Merchant="אורבניקה", Amount="35", Type="clothing store"
        Hebrew: "רכישה בחנות אורבניקה בסך 35 שקלים לקניית בגדים ואופנה"
        English: "Purchase at Urbanica store for 35 NIS for clothing and fashion items"
        
        Input: "עירית נתניה הוראת קבע 942.55"
        Extract: Merchant="עירית נתניה", Amount="942.55", Type="municipality payment"
        Hebrew: "תשלום חודשי לעירית נתניה בסך 942.55 שקלים עבור מסים ותשלומי חובה"
        English: "Monthly payment to Netanya Municipality for 942.55 NIS for taxes and mandatory payments"
        
        Formula for descriptive summaries:
        Hebrew: "תשלום/רכישה ב[merchant] בסך [amount] שקלים עבור [category description]"
        English: "Payment/Purchase at [merchant] for [amount] NIS for [category description]"
        
        IGNORE: timestamps, existing categories, English dates, GMT references
        FOCUS: merchant name, amount, transaction nature
        CREATE: proper Hebrew and English summaries (70-200 chars each)
      `,
      schema: z.object({
        summary: z.string().min(50).max(200),
        englishSummary: z.string().min(50).max(200),
        transactionType: TransactionAnalysisSchema.shape.transactionType,
        category: TransactionAnalysisSchema.shape.category
      }),
    });

    console.log('AI generated analysis:', analysisResult.object);

    // Generate embeddings for both summaries
    console.log('Generating embeddings...');
    console.log('Hebrew summary:', analysisResult.object.summary);
    console.log('English summary:', analysisResult.object.englishSummary);
    
    let embeddingResults;
    
    try {
      // Use embedMany for better performance and cleaner code
      embeddingResults = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: [
          analysisResult.object.summary,
          analysisResult.object.englishSummary
        ]
      });
    } catch (embeddingError) {
      console.error('=== EMBEDDING GENERATION ERROR ===');
      console.error('Embedding error type:', embeddingError?.constructor?.name);
      console.error('Embedding error message:', embeddingError instanceof Error ? embeddingError.message : String(embeddingError));
      console.error('Full embedding error:', embeddingError);
      console.error('================================');
      throw embeddingError; // Re-throw to let outer catch handle it
    }

    console.log('Embeddings generated successfully');
    console.log('Hebrew embedding length:', embeddingResults.embeddings[0].length);
    console.log('English embedding length:', embeddingResults.embeddings[1].length);
    console.log('First 5 values of Hebrew embedding:', embeddingResults.embeddings[0].slice(0, 5));

    // Combine analysis with embeddings
    const finalResult: TransactionAnalysis = {
      ...analysisResult.object,
      summaryEmbedding: embeddingResults.embeddings[0],
      englishSummaryEmbedding: embeddingResults.embeddings[1]
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