import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { createVectorStorageProvider } from './providers/factory';
import { VectorSearchOptions } from './providers/base';

export const vectorSearchTool = createTool({
  id: 'vector-search-transactions',
  description: 'Search for similar transactions using vector similarity search',
  inputSchema: z.object({
    searchQuery: z.string().describe('Search query in Hebrew or English to find similar transactions'),
    topK: z.number().min(1).max(20).default(5).describe('Number of similar transactions to return'),
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
      {
        topK: context.topK as number,
        filters: context.filters
      }
    );
  },
});

const searchSimilarTransactions = async (
  searchQuery: string,
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
    console.log('=== VECTOR SEARCH DEBUG START ===');
    console.log('Search query:', searchQuery);
    console.log('Options:', JSON.stringify(options, null, 2));
    
    console.log('Generating embedding for search query:', searchQuery);
    
    // Generate embedding for the search query
    const embeddingResult = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: [searchQuery],
    });

    console.log('Search embedding generated, length:', embeddingResult.embeddings[0].length);
    console.log('First 5 embedding values:', embeddingResult.embeddings[0].slice(0, 5));

    // Create the appropriate vector storage provider
    console.log('Creating vector storage provider...');
    const vectorProvider = createVectorStorageProvider();
    console.log('Vector provider created:', vectorProvider.name);
    
    // Search for similar vectors using the provider
    console.log('Performing vector search...');
    const searchResults = await vectorProvider.search(embeddingResult.embeddings[0], options);
    
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

    console.log('=== VECTOR SEARCH DEBUG END ===');

    return {
      query: searchQuery,
      results,
      totalResults: results.length,
      searchEmbedding: embeddingResult.embeddings[0],
    };

  } catch (error) {
    console.error('=== VECTOR SEARCH ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    console.error('Search query:', searchQuery);
    console.error('Options:', JSON.stringify(options, null, 2));
    console.error('========================');
    
    // Return detailed error information
    const errorDetails = {
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      searchQuery,
      options,
      timestamp: new Date().toISOString()
    };
    
    throw new Error(`Vector search failed: ${JSON.stringify(errorDetails, null, 2)}`);
  }
}; 