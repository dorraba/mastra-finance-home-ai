import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject, embedMany } from 'ai';
import { TransactionAnalysis, TransactionAnalysisSchema } from './types';
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
    storeInVector: z.boolean().default(true).describe('Whether to store the embeddings in Vectorize database'),
    vectorDB: z.unknown().optional().describe('Cloudflare Vectorize binding (env.FINANCE_VECTORS)'),
  }),
  outputSchema: TransactionAnalysisSchema.extend({
    vectorId: z.string().optional().describe('ID of the stored vector in Vectorize database'),
    mutationId: z.string().optional().describe('Vectorize mutation ID for the storage operation'),
  }),
  execute: async ({ context }) => {
    return await analyzeTransaction(
      context.transactionText, 
      context.storeInVector, 
      context.vectorDB
    );
  },
});

const analyzeTransaction = async (
  transactionText: string, 
  storeInVector: boolean = true, 
  vectorDB?: any
): Promise<TransactionAnalysis & { vectorId?: string; mutationId?: string }> => {
  try {
    // Clean the input text first
    const cleanedText = cleanTransactionText(transactionText);
    console.log('Original transaction:', transactionText);
    console.log('Cleaned transaction:', cleanedText);
    
    // Generate prompt from schema
    const schemaPrompt = generatePromptFromSchema(TransactionAnalysisSchema);
    console.log('Generated schema prompt:', schemaPrompt);
    
    // Generate the transaction analysis with placeholder embeddings
    const placeholderEmbedding = new Array(1536).fill(0); // Temporary placeholder
    
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
        
        Extract and return data according to this schema:
        - summary: Hebrew transaction summary (50-200 characters)
        - englishSummary: English transaction summary (50-200 characters)  
        - transactionType: regular/monthly/credit
        - category: appropriate category from the list
        - summaryEmbedding: will be filled programmatically (ignore this field)
        - englishSummaryEmbedding: will be filled programmatically (ignore this field)
        
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
        CREATE: proper Hebrew and English summaries (50-200 chars each)
      `,
      schema: TransactionAnalysisSchema.extend({
        summaryEmbedding: z.array(z.number()).default(placeholderEmbedding),
        englishSummaryEmbedding: z.array(z.number()).default(placeholderEmbedding)
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

    // Replace placeholder embeddings with real ones
    const finalResult: TransactionAnalysis & { vectorId?: string; mutationId?: string } = {
      ...analysisResult.object,
      summaryEmbedding: embeddingResults.embeddings[0],
      englishSummaryEmbedding: embeddingResults.embeddings[1]
    };

    // Store in vector database if requested
    if (storeInVector) {
      try {
        // Create the appropriate vector storage provider
        const vectorProvider = createVectorStorageProvider(vectorDB);
        
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
              hebrewSummary: analysisResult.object.summary,
              englishSummary: analysisResult.object.englishSummary,
              transactionType: analysisResult.object.transactionType,
              category: analysisResult.object.category,
              amount: amount,
              originalText: cleanedText,
              createdAt: new Date().toISOString(),
              embeddingModel: 'text-embedding-3-small'
            }
          }
        ];
        
        const insertResult = await vectorProvider.insert(vectors);
        console.log(`Successfully stored with ${vectorProvider.name}:`, insertResult.mutationId);
        
        finalResult.vectorId = vectorId;
        finalResult.mutationId = insertResult.mutationId;
        
      } catch (vectorError) {
        console.error('Failed to store in vector database:', vectorError);
        // Don't fail the entire operation if vector storage fails
      }
    }

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