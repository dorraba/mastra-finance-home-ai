import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

// Cloudflare Vectorize types
interface VectorizeBinding {
  query(vector: number[], options?: {
    topK?: number;
    returnValues?: boolean;
    returnMetadata?: 'none' | 'indexed' | 'all';
    filter?: Record<string, any>;
  }): Promise<{
    matches: Array<{
      id: string;
      score: number;
      values?: number[];
      metadata?: Record<string, any>;
    }>;
  }>;
}

interface SimilarTransaction {
  id: string;
  score: number;
  hebrewSummary: string;
  englishSummary: string;
  transactionType: string;
  category: string;
  amount: number;
  originalText: string;
  createdAt: string;
}

export const vectorSearchTool = createTool({
  id: 'vector-search-transactions',
  description: 'Search for similar transactions using vector similarity search in Cloudflare Vectorize',
  inputSchema: z.object({
    searchQuery: z.string().describe('Search query in Hebrew or English to find similar transactions'),
    vectorDB: z.any().describe('Cloudflare Vectorize binding (env.FINANCE_VECTORS)'),
    topK: z.number().min(1).max(20).default(5).describe('Number of similar transactions to return'),
    minScore: z.number().min(0).max(1).default(0.7).describe('Minimum similarity score threshold'),
    filters: z.object({
      transactionType: z.string().optional().describe('Filter by transaction type'),
      category: z.string().optional().describe('Filter by category'),
      minAmount: z.number().optional().describe('Minimum transaction amount'),
      maxAmount: z.number().optional().describe('Maximum transaction amount'),
    }).optional().describe('Optional filters to apply to the search'),
  }),
  outputSchema: z.object({
    query: z.string().describe('The search query that was used'),
    results: z.array(z.object({
      id: z.string().describe('Unique vector ID'),
      score: z.number().describe('Similarity score (0-1)'),
      hebrewSummary: z.string().describe('Hebrew transaction summary'),
      englishSummary: z.string().describe('English transaction summary'),
      transactionType: z.string().describe('Type of transaction'),
      category: z.string().describe('Transaction category'),
      amount: z.number().describe('Transaction amount'),
      originalText: z.string().describe('Original transaction text'),
      createdAt: z.string().describe('When the transaction was processed'),
    })).describe('Array of similar transactions found'),
    totalResults: z.number().describe('Total number of results found'),
    searchEmbedding: z.array(z.number()).describe('The embedding vector used for search'),
  }),
  execute: async ({ context }) => {
    return await searchSimilarTransactions(
      context.searchQuery as string,
      context.vectorDB,
      context.topK as number,
      context.minScore as number,
      context.filters
    );
  },
});

const searchSimilarTransactions = async (
  searchQuery: string,
  vectorDB: VectorizeBinding,
  topK: number = 5,
  minScore: number = 0.7,
  filters?: {
    transactionType?: string;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
  }
): Promise<{
  query: string;
  results: SimilarTransaction[];
  totalResults: number;
  searchEmbedding: number[];
}> => {
  try {
    console.log('Generating embedding for search query:', searchQuery);
    
    // Generate embedding for the search query
    const embeddingResult = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: searchQuery,
    });

    console.log('Search embedding generated, length:', embeddingResult.embedding.length);

    // Check if vectorDB is available (only in Cloudflare Workers environment)
    if (!vectorDB || typeof vectorDB.query !== 'function') {
      console.log('🔧 Local development mode: Vectorize not available, returning mock results');
      
      // Return mock results for local development
      const mockResults: SimilarTransaction[] = [
        {
          id: 'mock_transaction_1',
          score: 0.92,
          hebrewSummary: 'תשלום חודשי לעירית נתניה בסך 942.55 שקלים עבור תשלומי חובה',
          englishSummary: 'Monthly payment to Netanya Municipality for 942.55 NIS for mandatory payments',
          transactionType: 'monthly',
          category: 'mandatory_payments',
          amount: 942.55,
          originalText: 'עירית נתניה הוראת קבע 942.55',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock_transaction_2',
          score: 0.85,
          hebrewSummary: 'רכישה ברמי לוי השקמה בסך 156.80 שקלים עבור קניות מזון',
          englishSummary: 'Purchase at Rami Levy Hashikma for 156.80 NIS for food shopping',
          transactionType: 'regular',
          category: 'food_beverage',
          amount: 156.80,
          originalText: 'רמי לוי שיווק השקמה 156.80',
          createdAt: new Date().toISOString(),
        }
      ];

      // Apply filters to mock results if provided
      let filteredMockResults = mockResults;
      if (filters) {
        filteredMockResults = mockResults.filter(result => {
          if (filters.transactionType && result.transactionType !== filters.transactionType) return false;
          if (filters.category && result.category !== filters.category) return false;
          if (filters.minAmount !== undefined && result.amount < filters.minAmount) return false;
          if (filters.maxAmount !== undefined && result.amount > filters.maxAmount) return false;
          return result.score >= minScore;
        });
      }

      return {
        query: searchQuery,
        results: filteredMockResults.slice(0, topK),
        totalResults: filteredMockResults.length,
        searchEmbedding: embeddingResult.embedding,
      };
    }

    // Prepare filter object for Vectorize
    const vectorizeFilter: Record<string, any> = {};
    
    if (filters) {
      if (filters.transactionType) {
        vectorizeFilter.transactionType = { $eq: filters.transactionType };
      }
      if (filters.category) {
        vectorizeFilter.category = { $eq: filters.category };
      }
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        vectorizeFilter.amount = {};
        if (filters.minAmount !== undefined) {
          vectorizeFilter.amount.$gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          vectorizeFilter.amount.$lte = filters.maxAmount;
        }
      }
    }

    console.log('Searching Vectorize with filters:', vectorizeFilter);

    // Search for similar vectors
    const searchResult = await vectorDB.query(embeddingResult.embedding, {
      topK: topK,
      returnValues: false, // We don't need the vector values back
      returnMetadata: 'all', // We want all metadata
      filter: Object.keys(vectorizeFilter).length > 0 ? vectorizeFilter : undefined,
    });

    console.log(`Found ${searchResult.matches.length} potential matches`);

    // Filter results by minimum score and transform to our format
    const filteredResults: SimilarTransaction[] = searchResult.matches
      .filter(match => match.score >= minScore)
      .map(match => ({
        id: match.id,
        score: match.score,
        hebrewSummary: match.metadata?.hebrewSummary || '',
        englishSummary: match.metadata?.englishSummary || '',
        transactionType: match.metadata?.transactionType || '',
        category: match.metadata?.category || '',
        amount: match.metadata?.amount || 0,
        originalText: match.metadata?.originalText || '',
        createdAt: match.metadata?.createdAt || '',
      }));

    console.log(`Returning ${filteredResults.length} results after filtering by score >= ${minScore}`);

    return {
      query: searchQuery,
      results: filteredResults,
      totalResults: filteredResults.length,
      searchEmbedding: embeddingResult.embedding,
    };

  } catch (error) {
    console.error('=== VECTOR SEARCH ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Search query:', searchQuery);
    console.error('========================');
    
    throw error;
  }
}; 