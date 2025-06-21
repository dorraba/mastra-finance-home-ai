// TypeScript types for Cloudflare Vectorize binding

import { envLog } from '../../../config/environment';

export interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: Record<string, string | number | boolean | null>;
}

export interface VectorizeQueryOptions {
  topK?: number;
  returnValues?: boolean;
  returnMetadata?: 'none' | 'indexed' | 'all';
  filter?: Record<string, Record<string, string | number | boolean>>;
}

export interface VectorizeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, string | number | boolean | null>;
}

export interface VectorizeQueryResult {
  matches: VectorizeMatch[];
}

export interface VectorizeInsertResult {
  mutationId: string;
}

/**
 * Cloudflare Vectorize binding interface
 * This represents the actual Vectorize binding available in Cloudflare Workers
 */
export interface VectorizeBinding {
  insert(vectors: VectorizeVector[]): Promise<VectorizeInsertResult>;
  query(
    vector: number[], 
    options?: VectorizeQueryOptions
  ): Promise<VectorizeQueryResult>;
}

/**
 * Type guard to check if an object is a valid Vectorize binding
 */
export function isVectorizeBinding(obj: unknown): obj is VectorizeBinding {
  envLog('🔍 Checking if object is VectorizeBinding...');
  envLog(`🔍 obj is null: ${obj === null}`);
  envLog(`🔍 typeof obj: ${typeof obj}`);
  
  if (obj === null || typeof obj !== 'object') {
    envLog('🔍 ❌ Failed: obj is null or not an object');
    return false;
  }
  
  const hasInsert = 'insert' in obj;
  const hasQuery = 'query' in obj;
  envLog(`🔍 has insert property: ${hasInsert}`);
  envLog(`🔍 has query property: ${hasQuery}`);
  
  if (!hasInsert || !hasQuery) {
    envLog('🔍 ❌ Failed: missing insert or query property');
    envLog(`🔍 Available properties: ${Object.keys(obj).join(', ')}`);
    return false;
  }
  
  const insertType = typeof (obj as any).insert;
  const queryType = typeof (obj as any).query;
  envLog(`🔍 insert type: ${insertType}`);
  envLog(`🔍 query type: ${queryType}`);
  
  if (insertType !== 'function' || queryType !== 'function') {
    envLog('🔍 ❌ Failed: insert or query is not a function');
    return false;
  }
  
  envLog('🔍 ✅ Success: object is a valid VectorizeBinding');
  return true;
} 