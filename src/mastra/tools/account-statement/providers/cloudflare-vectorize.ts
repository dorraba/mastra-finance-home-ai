// Cloudflare Vectorize Provider Implementation

import { 
  VectorStorageProvider, 
  VectorRecord, 
  VectorSearchResult, 
  VectorSearchOptions,
  VectorMetadata 
} from './base';
import { 
  VectorizeBinding, 
  VectorizeVector,
  isVectorizeBinding 
} from './types';

export class CloudflareVectorizeProvider implements VectorStorageProvider {
  name = 'CloudflareVectorize';
  
  constructor(private vectorDB: VectorizeBinding | unknown) {}
  
  isAvailable(): boolean {
    return isVectorizeBinding(this.vectorDB);
  }
  
  async insert(vectors: VectorRecord[]): Promise<{ mutationId: string }> {
    if (!isVectorizeBinding(this.vectorDB)) {
      throw new Error('Cloudflare Vectorize is not available');
    }
    
    const vectorizeVectors: VectorizeVector[] = vectors.map(vector => ({
      id: vector.id,
      values: vector.values,
      metadata: vector.metadata
    }));
    
    return await this.vectorDB.insert(vectorizeVectors);
  }
  
  async search(
    queryVector: number[], 
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    if (!isVectorizeBinding(this.vectorDB)) {
      throw new Error('Cloudflare Vectorize is not available');
    }
    
    const { topK = 5, minScore = 0.7, filters } = options;
    
    // Prepare filter object for Vectorize
    const vectorizeFilter: Record<string, Record<string, string | number | boolean>> = {};
    
    if (filters) {
      if (filters.transactionType) {
        vectorizeFilter.transactionType = { $eq: filters.transactionType };
      }
      if (filters.category) {
        vectorizeFilter.category = { $eq: filters.category };
      }
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        const amountFilter: Record<string, number> = {};
        if (filters.minAmount !== undefined) {
          amountFilter.$gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          amountFilter.$lte = filters.maxAmount;
        }
        vectorizeFilter.amount = amountFilter;
      }
    }
    
    const searchResult = await this.vectorDB.query(queryVector, {
      topK: topK,
      returnValues: false,
      returnMetadata: 'all',
      filter: Object.keys(vectorizeFilter).length > 0 ? vectorizeFilter : undefined,
    });
    
    return searchResult.matches
      .filter(match => match.score >= minScore)
      .map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata as unknown as VectorMetadata
      }));
  }
} 