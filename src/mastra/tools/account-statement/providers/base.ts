// Base interfaces and types for vector storage providers

export interface VectorMetadata extends Record<string, string | number | boolean | null> {
  hebrewSummary: string;
  englishSummary: string;
  transactionType: string;
  category: string;
  amount: number;
  originalText: string;
  createdAt: string;
  embeddingModel: string;
}

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

export interface VectorSearchOptions {
  topK?: number;
  filters?: {
    transactionType?: string;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
  };
}

export interface VectorStorageProvider {
  name: string;
  isAvailable(): boolean;
  insert(vectors: VectorRecord[]): Promise<{ mutationId: string }>;
  search(
    queryVector: number[], 
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult[]>;
} 