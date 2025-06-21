// SQLite Provider Implementation for Local Development

import { 
  VectorStorageProvider, 
  VectorRecord, 
  VectorSearchResult, 
  VectorSearchOptions,
  VectorMetadata 
} from './base';
import { insertTransaction, getAllTransactions, getTransactionById, searchTransactionsByCategory } from '../../../../database/sqlite';

export class SQLiteProvider implements VectorStorageProvider {
  name = 'SQLite';
  private englishEmbeddings: Map<string, number[]> = new Map();
  
  constructor() {}
  
  // Method to set English embedding before insert
  setEnglishEmbedding(vectorId: string, embedding: number[]) {
    this.englishEmbeddings.set(vectorId, embedding);
  }
  
  isAvailable(): boolean {
    return true; // SQLite is always available
  }
  
  async insert(vectors: VectorRecord[]): Promise<{ mutationId: string }> {
    try {
      for (const vector of vectors) {
        const metadata = vector.metadata as any;
        
        // The vector.values contains the Hebrew embedding
        // The English embedding is stored separately in our map
        const hebrewEmbedding = vector.values;
        const englishEmbedding = this.englishEmbeddings.get(vector.id) || vector.values; // fallback to Hebrew embedding
        
        console.log(`📝 Inserting transaction ${vector.id} into SQLite`);
        console.log(`   Hebrew summary: ${metadata.hebrewSummary}`);
        console.log(`   English summary: ${metadata.englishSummary}`);
        console.log(`   Type: ${metadata.transactionType}, Category: ${metadata.category}`);
        
        insertTransaction({
          id: vector.id,
          originalText: metadata.originalText || '',
          hebrewSummary: metadata.hebrewSummary || '',
          englishSummary: metadata.englishSummary || '',
          transactionType: metadata.transactionType || '',
          category: metadata.category || '',
          amount: parseFloat(metadata.amount) || 0,
          hebrewEmbedding: hebrewEmbedding,
          englishEmbedding: englishEmbedding
        });
        
        // Clean up the English embedding from memory after insert
        this.englishEmbeddings.delete(vector.id);
      }
      
      const mutationId = `sqlite_${Date.now()}`;
      console.log(`✅ SQLite insert completed with mutation ID: ${mutationId}`);
      return { mutationId };
    } catch (error) {
      console.error('❌ SQLite insert error:', error);
      throw new Error(`SQLite insert failed: ${error}`);
    }
  }
  
  async search(
    queryVector: number[], 
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const { topK = 5, filters } = options;
      
      console.log(`🔍 SQLite search: query vector length=${queryVector.length}, topK=${topK}`);
      
      let results: any[] = [];
      
      // If category filter is specified, use it
      if (filters?.category) {
        results = searchTransactionsByCategory(filters.category);
        console.log(`📂 Filtered by category '${filters.category}': ${results.length} results`);
      } else {
        results = getAllTransactions();
        console.log(`📊 All transactions: ${results.length} results`);
      }
      
      // Calculate actual vector similarity for each transaction
      const scoredResults: Array<{row: any, score: number}> = [];
      
      for (const row of results) {
        // Parse Hebrew embedding from JSON
        let hebrewEmbedding: number[] = [];
        try {
          hebrewEmbedding = JSON.parse(row.hebrew_embedding || '[]');
        } catch (e) {
          console.warn(`⚠️  Failed to parse Hebrew embedding for ${row.id}`);
          continue;
        }
        
        if (hebrewEmbedding.length !== queryVector.length) {
          console.warn(`⚠️  Embedding dimension mismatch for ${row.id}: ${hebrewEmbedding.length} vs ${queryVector.length}`);
          continue;
        }
        
        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(queryVector, hebrewEmbedding);
        
        // Add all results (no threshold filtering)
        scoredResults.push({ row, score: similarity });
      }
      
      // Sort by similarity score (highest first) and take top K
      scoredResults.sort((a, b) => b.score - a.score);
      const topResults = scoredResults.slice(0, topK);
      
      console.log(`✅ SQLite search completed: returning top ${topResults.length} results sorted by similarity`);
      topResults.forEach((result, i) => {
        console.log(`   ${i+1}. ${result.row.hebrew_summary} (score: ${result.score.toFixed(3)})`);
      });
      
      return topResults.map(({ row, score }) => ({
        id: row.id,
        score: score,
        metadata: {
          hebrewSummary: row.hebrew_summary,
          englishSummary: row.english_summary,
          transactionType: row.transaction_type,
          category: row.category,
          amount: row.amount,
          originalText: row.original_text,
          createdAt: row.created_at,
          embeddingModel: row.embedding_model
        } as VectorMetadata
      }));
    } catch (error) {
      console.error('❌ SQLite search error:', error);
      throw new Error(`SQLite search failed: ${error}`);
    }
  }
  
  // Calculate cosine similarity between two vectors
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  // Additional helper method to get all transactions for debugging
  async getAllTransactions() {
    return getAllTransactions();
  }
  
  // Helper method to get transaction by ID
  async getTransaction(id: string) {
    return getTransactionById(id);
  }
} 