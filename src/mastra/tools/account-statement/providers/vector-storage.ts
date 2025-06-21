// Vector Storage Provider Exports

// Base interfaces and types
export {
  VectorStorageProvider,
  VectorRecord,
  VectorSearchResult,
  VectorSearchOptions,
  VectorMetadata
} from './base';

// Local provider implementations
export { MockVectorProvider } from './mock';
export { SQLiteProvider } from './sqlite';

// Factory function
export { createVectorStorageProvider, getProviderInfo } from './factory'; 