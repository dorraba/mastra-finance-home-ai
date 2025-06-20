// Vector Storage Provider - Main Export File
// Re-exports all provider components from separate files

// Base interfaces and types
export type {
  VectorMetadata,
  VectorRecord,
  VectorSearchResult,
  VectorSearchOptions,
  VectorStorageProvider
} from './base';

// Cloudflare Vectorize specific types
export type {
  VectorizeVector,
  VectorizeQueryOptions,
  VectorizeMatch,
  VectorizeQueryResult,
  VectorizeInsertResult,
  VectorizeBinding
} from './types';
export { isVectorizeBinding } from './types';

// Provider implementations
export { CloudflareVectorizeProvider } from './cloudflare-vectorize';
export { MockVectorProvider } from './mock';

// Factory and utilities
export { createVectorStorageProvider, getProviderInfo } from './factory'; 