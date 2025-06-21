// Vector Storage Provider Exports - Cloudflare Only

// Base interfaces and types
export type {
  VectorStorageProvider,
  VectorRecord,
  VectorSearchResult,
  VectorSearchOptions,
  VectorMetadata
} from './base';

// Cloudflare Vectorize provider
export { CloudflareVectorizeProvider } from './cloudflare';

// Factory function
export { createVectorStorageProvider, getProviderInfo } from './factory'; 