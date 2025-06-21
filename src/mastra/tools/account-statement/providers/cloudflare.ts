// Cloudflare Vectorize Provider using @mastra/vectorize

import { CloudflareVector } from '@mastra/vectorize';
import { 
  VectorStorageProvider, 
  VectorRecord, 
  VectorSearchResult, 
  VectorSearchOptions,
  VectorMetadata 
} from './base';

export class CloudflareVectorizeProvider implements VectorStorageProvider {
  name = 'CloudflareVectorize';
  private store: CloudflareVector;
  private indexName: string;
  
  constructor(accountId: string, apiToken: string, indexName: string = 'finance-transactions') {
    this.store = new CloudflareVector({
      accountId,
      apiToken
    });
    this.indexName = indexName;
  }
  
  isAvailable(): boolean {
    // Check if Cloudflare credentials are available
    return !!(process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN);
  }
  
  async insert(vectors: VectorRecord[]): Promise<{ mutationId: string }> {
    console.log(`📦 [${this.name}] Inserting ${vectors.length} vectors into index "${this.indexName}"`);
    
    // Transform vectors to Cloudflare format
    const embeddings = vectors.map(vector => ({
      id: vector.id,
      values: vector.values,
      metadata: vector.metadata
    }));
    
    try {
      // Ensure index exists
      await this.ensureIndexExists(vectors[0]?.values.length || 1536);
      
      // Upsert vectors
      await this.store.upsert({
        indexName: this.indexName,
        vectors: embeddings.map(e => e.values),
        metadata: embeddings.map(e => e.metadata),
        ids: embeddings.map(e => e.id)
      });
      
      const mutationId = `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`✅ [${this.name}] Successfully inserted ${vectors.length} vectors`);
      
      return { mutationId };
    } catch (error) {
      console.error(`❌ [${this.name}] Error inserting vectors:`, error);
      throw error;
    }
  }
  
  async search(
    queryVector: number[], 
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const { topK = 5, filters } = options;
    
    console.log(`🔍 [${this.name}] Searching index "${this.indexName}" with ${queryVector.length} dimensions...`);
    
    try {
      // Perform vector search
      const results = await this.store.query({
        indexName: this.indexName,
        queryVector: queryVector,
        topK,
        includeVector: false,
        filter: this.buildCloudflareFilter(filters)
      });
      
      // Transform results to our format
      const searchResults: VectorSearchResult[] = results.map(result => ({
        id: result.id,
        score: result.score || 0,
        metadata: result.metadata as VectorMetadata
      }));
      
      console.log(`📊 [${this.name}] Found ${searchResults.length} results`);
      
      return searchResults;
    } catch (error) {
      console.error(`❌ [${this.name}] Error searching vectors:`, error);
      throw error;
    }
  }
  
  private async ensureIndexExists(dimension: number): Promise<void> {
    try {
      // Try to create index (will fail silently if it already exists)
      await this.store.createIndex({
        indexName: this.indexName,
        dimension
      });
      console.log(`✅ [${this.name}] Index "${this.indexName}" ready`);
    } catch (error) {
      // Index might already exist, which is fine
      console.log(`ℹ️ [${this.name}] Index "${this.indexName}" already exists or creation failed:`, error);
    }
  }
  
  private buildCloudflareFilter(filters?: Record<string, any>): Record<string, any> | undefined {
    if (!filters) return undefined;
    
    const cloudflareFilter: Record<string, any> = {};
    
    // Map our filter format to Cloudflare's expected format
    if (filters.transactionType) {
      cloudflareFilter.transactionType = { $eq: filters.transactionType };
    }
    
    if (filters.category) {
      cloudflareFilter.category = { $eq: filters.category };
    }
    
    if (filters.minAmount !== undefined) {
      cloudflareFilter.amount = { $gte: filters.minAmount };
    }
    
    if (filters.maxAmount !== undefined) {
      if (cloudflareFilter.amount) {
        cloudflareFilter.amount.$lte = filters.maxAmount;
      } else {
        cloudflareFilter.amount = { $lte: filters.maxAmount };
      }
    }
    
    return Object.keys(cloudflareFilter).length > 0 ? cloudflareFilter : undefined;
  }
} 