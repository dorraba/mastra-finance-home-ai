import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject, embedMany } from 'ai';
import { TransactionAnalysis, TransactionAnalysisSchema, TransactionTypeSchema, TransactionCategorySchema } from './types';
import { generatePromptFromSchema } from './schema-prompt-generator';
import { createVectorStorageProvider } from './providers/factory';
import { VectorRecord } from './providers/base';

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
    storeInVector: z.boolean().default(true).describe('Whether to store the embeddings in the local vector database'),
  }),
  outputSchema: z.object({
    summary: z.string().describe('Hebrew transaction summary'),
    englishSummary: z.string().describe('English transaction summary'),
    summaryEmbedding: z.array(z.number()).length(1536).describe('Vector embedding of Hebrew summary (1536 dimensions)'),
    englishSummaryEmbedding: z.array(z.number()).length(1536).describe('Vector embedding of English summary (1536 dimensions)'),
    transactionType: TransactionTypeSchema,
    category: TransactionCategorySchema,
    vectorId: z.string().optional().describe('ID of the stored vector in the local database'),
    mutationId: z.string().optional().describe('Database mutation ID for the storage operation'),
  }),
  execute: async ({ context }) => {
    return await analyzeTransaction(
      context.transactionText, 
      context.storeInVector
    );
  },
});

const analyzeTransaction = async (
  transactionText: string, 
  storeInVector: boolean = true
): Promise<TransactionAnalysis & { vectorId?: string; mutationId?: string }> => {
  // Clean the input text first
  const cleanedText = cleanTransactionText(transactionText);
  
  // Generate prompt from schema
  const schemaPrompt = generatePromptFromSchema(TransactionAnalysisSchema);
  
  // Generate the transaction analysis (text fields only)
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
      
      You MUST return exactly these 4 fields:
      1. summary: Hebrew transaction summary (exactly 50-200 characters)
      2. englishSummary: English transaction summary (exactly 50-200 characters)  
      3. transactionType: MUST be one of: "regular", "monthly", or "credit"
      4. category: MUST be one of: "food_beverage", "transportation", "shopping_entertainment", "fuel", "healthcare", "education", "insurance", "mandatory_payments", "restaurants", "grocery", "clothing_shoes", "technology", "home_design", "sports_recreation", "banking_finance", "other"
      
      CRITICAL RULES:
      - Both summaries MUST be at least 50 characters and at most 200 characters
      - transactionType must be exactly one of the 3 allowed values
      - category must be exactly one of the 16 allowed values
      - Use proper Hebrew and English text
      
      Examples:
      
      Input: "אורבניקה 35"
      Output:
      - summary: "רכישה בחנות אורבניקה בסך 35 שקלים לקניית בגדים ואופנה יפה ומעוצבת"
      - englishSummary: "Purchase at Urbanica store for 35 NIS for clothing and fashion items"
      - transactionType: "regular"
      - category: "clothing_shoes"
      
      Input: "עירית נתניה הוראת קבע 942.55"
      Output:
      - summary: "תשלום חודשי לעירית נתניה בסך 942.55 שקלים עבור מסים ותשלומי חובה עירוניים"
      - englishSummary: "Monthly payment to Netanya Municipality for 942.55 NIS for taxes and mandatory payments"
      - transactionType: "monthly"
      - category: "mandatory_payments"
      
      Make sure your response is exactly in the required format with valid values only.
    `,
    schema: z.object({
      summary: z.string().min(50, 'Summary must be at least 50 characters').max(200, 'Summary max 200 characters'),
      englishSummary: z.string().min(50, 'English summary must be at least 50 characters').max(200, 'English summary max 200 characters'),
      transactionType: z.enum(['regular', 'monthly', 'credit']).describe('Transaction type: regular, monthly, or credit'),
      category: z.enum(['food_beverage', 'transportation', 'shopping_entertainment', 'fuel', 'healthcare', 'education', 'insurance', 'mandatory_payments', 'restaurants', 'grocery', 'clothing_shoes', 'technology', 'home_design', 'sports_recreation', 'banking_finance', 'other']).describe('Transaction category')
    }),
  }).catch(error => {
    console.error('=== GENERATE OBJECT SCHEMA ERROR ===');
    console.error('Input text:', cleanedText);
    console.error('Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('=====================================');
    throw error;
  });

  // Use embedMany for better performance and cleaner code
  const embeddingResults = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: [
      analysisResult.object.summary,
      analysisResult.object.englishSummary
    ]
  });

  // Replace placeholder embeddings with real ones
  const finalResult: TransactionAnalysis & { vectorId?: string; mutationId?: string } = {
    summary: analysisResult.object.summary as string,
    englishSummary: analysisResult.object.englishSummary as string,
    transactionType: analysisResult.object.transactionType as TransactionAnalysis['transactionType'],
    category: analysisResult.object.category as TransactionAnalysis['category'],
    summaryEmbedding: embeddingResults.embeddings[0],
    englishSummaryEmbedding: embeddingResults.embeddings[1]
  };

  // Store in vector database if requested
  if (storeInVector) {
    // Create the appropriate vector storage provider
    const vectorProvider = createVectorStorageProvider();
    
    // Extract amount from the transaction text for metadata
    const amountMatch = cleanedText.match(/[\d,]+\.?\d*/);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace(',', '')) : 0;
    
    // Generate unique ID for this transaction
    const vectorId = `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare vectors for storage (we'll store the Hebrew summary embedding as primary)
    const vectors: VectorRecord[] = [
      {
        id: vectorId,
        values: embeddingResults.embeddings[0], // Hebrew embedding
        metadata: {
          hebrewSummary: analysisResult.object.summary as string,
          englishSummary: analysisResult.object.englishSummary as string,
          transactionType: analysisResult.object.transactionType as string,
          category: analysisResult.object.category as string,
          amount: amount,
          originalText: cleanedText,
          createdAt: new Date().toISOString(),
          embeddingModel: 'text-embedding-3-small'
        }
      }
    ];
    

    
    const insertResult = await vectorProvider.insert(vectors);
    
    finalResult.vectorId = vectorId;
    finalResult.mutationId = insertResult.mutationId;
  }

  return finalResult;
}; 