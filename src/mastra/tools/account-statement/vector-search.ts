import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { createVectorStorageProvider } from './providers/factory';
import { VectorSearchOptions } from './providers/base';

export const vectorSearchTool = createTool({
  id: 'vector-search-transactions',
  description: 'Search for similar transactions using vector similarity search',
  inputSchema: z.object({
    searchQuery: z.string().describe('Search query in Hebrew or English to find similar transactions'),
    vectorDB: z.unknown().optional().describe('Vector database binding (optional for local development)'),
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
      {
        topK: context.topK as number,
        minScore: context.minScore as number,
        filters: context.filters
      }
    );
  },
});

const searchSimilarTransactions = async (
  searchQuery: string,
  vectorDB: unknown,
  options: VectorSearchOptions
): Promise<{
  query: string;
  results: Array<{
    id: string;
    score: number;
    hebrewSummary: string;
    englishSummary: string;
    transactionType: string;
    category: string;
    amount: number;
    originalText: string;
    createdAt: string;
  }>;
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

    // Create the appropriate vector storage provider
    const vectorProvider = createVectorStorageProvider(vectorDB);
    
    // Search for similar vectors using the provider
    const searchResults = await vectorProvider.search(embeddingResult.embedding, options);
    
    console.log(`Found ${searchResults.length} results using ${vectorProvider.name}`);

    // Transform results to match expected output format
    const results = searchResults.map(result => ({
      id: result.id,
      score: result.score,
      hebrewSummary: result.metadata.hebrewSummary,
      englishSummary: result.metadata.englishSummary,
      transactionType: result.metadata.transactionType,
      category: result.metadata.category,
      amount: result.metadata.amount,
      originalText: result.metadata.originalText,
      createdAt: result.metadata.createdAt,
    }));

    return {
      query: searchQuery,
      results,
      totalResults: results.length,
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