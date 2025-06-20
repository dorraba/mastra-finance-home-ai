import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject, embed } from 'ai';
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
    
    // First, generate the transaction analysis without embeddings
    const analysisResult = await generateObject({
      model: openai(process.env.MODEL ?? "gpt-4o"),
      prompt: `
        You are an expert Hebrew banking transaction analyzer for Israeli financial data.
        
        Analyze this Hebrew transaction text: "${transactionText}"
        
        Extract and return data according to this schema (ignore embedding fields for now):
        
        ${schemaPrompt}
        
        CRITICAL: Both summaries MUST be at least 70 characters long. Here's how to achieve this:
        
        For a fashion store transaction like "אופנת טוונט פור סבן 339.80 ₪":
        
        Hebrew summary example:
        "רכישה בחנות אופנת טוונט פור סבן בסך 339.80 שקלים, קנייה רגילה של בגדים ואופנה"
        
        English summary example:
        "Purchase at Twenty Four Seven fashion store for 339.80 NIS, regular clothing and fashion shopping"
        
        Formula for 70+ character summaries:
        Hebrew:
        - Start: "רכישה ב..." / "תשלום ל..." / "עסקה ב..."
        - Merchant: "חנות X" / "בנק X" / "חברת X"  
        - Amount: "בסך X שקלים"
        - Context: "קנייה רגילה של..." / "שירות של..." / "תשלום עבור..."
        
        English:
        - Start: "Purchase at..." / "Payment to..." / "Transaction at..."
        - Merchant: "X store" / "X bank" / "X company"
        - Amount: "for X NIS" / "of X shekels"
        - Context: "regular purchase of..." / "service for..." / "payment for..."
        
        Count characters carefully - both summaries must be 70-200 characters!
        
        Return only: summary, englishSummary, transactionType, category (no embeddings)
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