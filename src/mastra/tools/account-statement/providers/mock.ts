// Mock Vector Provider for Local Development

import { 
  VectorStorageProvider, 
  VectorRecord, 
  VectorSearchResult, 
  VectorSearchOptions,
  VectorMetadata 
} from './base';

export class MockVectorProvider implements VectorStorageProvider {
  name = 'MockVector';
  private vectors = new Map<string, VectorRecord>();
  
  isAvailable(): boolean {
    return true; // Always available for local development
  }
  
  async insert(vectors: VectorRecord[]): Promise<{ mutationId: string }> {
    const mutationId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    for (const vector of vectors) {
      this.vectors.set(vector.id, {
        ...vector,
        metadata: {
          ...vector.metadata,
          createdAt: new Date().toISOString()
        }
      });
      console.log(`📦 [${this.name}] Stored vector ${vector.id} with ${vector.values.length} dimensions`);
    }
    
    return { mutationId };
  }
  
  async search(
    queryVector: number[], 
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const { topK = 5, minScore = 0.7, filters } = options;
    
    console.log(`🔍 [${this.name}] Querying ${this.vectors.size} stored vectors...`);
    
    // If no vectors stored, return mock data
    if (this.vectors.size === 0) {
      return this.getMockResults(options);
    }
    
    const matches: VectorSearchResult[] = [];
    
    for (const [id, storedVector] of this.vectors.entries()) {
      // Simple cosine similarity calculation
      const score = this.cosineSimilarity(queryVector, storedVector.values);
      
      // Apply filters if provided
      if (filters && !this.matchesFilter(storedVector.metadata, filters)) {
        continue;
      }
      
      if (score >= minScore) {
        matches.push({
          id,
          score,
          metadata: storedVector.metadata
        });
      }
    }
    
    // Sort by score and take topK
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }
  
  private getMockResults(options: VectorSearchOptions): VectorSearchResult[] {
    const { topK = 5, minScore = 0.7, filters } = options;
    
    const mockResults: VectorSearchResult[] = [
      {
        id: 'mock_transaction_1',
        score: 0.92,
        metadata: {
          hebrewSummary: 'תשלום חודשי לעירית נתניה בסך 942.55 שקלים עבור תשלומי חובה',
          englishSummary: 'Monthly payment to Netanya Municipality for 942.55 NIS for mandatory payments',
          transactionType: 'monthly',
          category: 'mandatory_payments',
          amount: 942.55,
          originalText: 'עירית נתניה הוראת קבע 942.55',
          createdAt: new Date().toISOString(),
          embeddingModel: 'text-embedding-3-small'
        }
      },
      {
        id: 'mock_transaction_2',
        score: 0.85,
        metadata: {
          hebrewSummary: 'רכישה ברמי לוי השקמה בסך 156.80 שקלים עבור קניות מזון',
          englishSummary: 'Purchase at Rami Levy Hashikma for 156.80 NIS for food shopping',
          transactionType: 'regular',
          category: 'food_beverage',
          amount: 156.80,
          originalText: 'רמי לוי שיווק השקמה 156.80',
          createdAt: new Date().toISOString(),
          embeddingModel: 'text-embedding-3-small'
        }
      },
      {
        id: 'mock_transaction_3',
        score: 0.78,
        metadata: {
          hebrewSummary: 'תשלום דלק בתחנת פז בסך 280.50 שקלים עבור תדלוק רכב',
          englishSummary: 'Fuel payment at Paz station for 280.50 NIS for car refueling',
          transactionType: 'regular',
          category: 'fuel',
          amount: 280.50,
          originalText: 'פז תחנת דלק 280.50',
          createdAt: new Date().toISOString(),
          embeddingModel: 'text-embedding-3-small'
        }
      }
    ];
    
    // Apply filters to mock results
    let filteredResults = mockResults.filter(result => {
      if (filters?.transactionType && result.metadata.transactionType !== filters.transactionType) return false;
      if (filters?.category && result.metadata.category !== filters.category) return false;
      if (filters?.minAmount !== undefined && result.metadata.amount < filters.minAmount) return false;
      if (filters?.maxAmount !== undefined && result.metadata.amount > filters.maxAmount) return false;
      return result.score >= minScore;
    });
    
    return filteredResults.slice(0, topK);
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  private matchesFilter(metadata: VectorMetadata, filters: NonNullable<VectorSearchOptions['filters']>): boolean {
    if (filters.transactionType && metadata.transactionType !== filters.transactionType) return false;
    if (filters.category && metadata.category !== filters.category) return false;
    if (filters.minAmount !== undefined && metadata.amount < filters.minAmount) return false;
    if (filters.maxAmount !== undefined && metadata.amount > filters.maxAmount) return false;
    return true;
  }
} 