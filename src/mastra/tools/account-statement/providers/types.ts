// TypeScript types for Cloudflare Vectorize binding

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
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'insert' in obj &&
    'query' in obj &&
    typeof (obj as any).insert === 'function' &&
    typeof (obj as any).query === 'function'
  );
} 