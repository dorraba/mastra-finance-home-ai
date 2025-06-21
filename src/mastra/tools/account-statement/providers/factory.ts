// Vector Storage Provider Factory with Environment Detection

import { VectorStorageProvider } from './base';
import { MockVectorProvider } from './mock';
import { SQLiteProvider } from './sqlite';
import { ENV } from '../../../config/environment';

/**
 * Create the appropriate vector storage provider based on environment configuration
 */
export function createVectorStorageProvider(): VectorStorageProvider {
  console.log('🏗️  Creating vector storage provider...');
  console.log(`Environment: ${ENV.isProduction ? 'production' : 'development'}`);
  console.log(`Vector storage mode: ${ENV.vectorStorageMode}`);
  
  // If explicitly set to sqlite, use SQLite provider
  if (ENV.vectorStorageMode === 'sqlite') {
    console.log('📁 Using SQLite provider (explicitly configured)');
    return new SQLiteProvider();
  }
  
  // If explicitly set to mock, use Mock provider
  if (ENV.vectorStorageMode === 'mock') {
    console.log('🎭 Using Mock provider (explicitly configured)');
    return new MockVectorProvider();
  }
  
  // Auto mode: prefer SQLite in all cases since it's more reliable than mock
  console.log('🤖 Auto mode: choosing SQLite provider as default');
  return new SQLiteProvider();
}

/**
 * Get information about available providers for debugging
 */
export function getProviderInfo(): {
  current: { name: string; available: boolean; reason: string };
  available: { name: string; available: boolean; reason: string }[];
  recommendation: string;
} {
  const sqliteProvider = new SQLiteProvider();
  const mockProvider = new MockVectorProvider();
  
  const providers = [
    {
      name: sqliteProvider.name,
      available: sqliteProvider.isAvailable(),
      reason: sqliteProvider.isAvailable() 
        ? 'SQLite database available for local storage'
        : 'SQLite not available'
    },
    {
      name: mockProvider.name,
      available: mockProvider.isAvailable(),
      reason: mockProvider.isAvailable()
        ? 'Mock provider always available for testing'
        : 'Mock provider not available'
    }
  ];
  
  const currentProvider = createVectorStorageProvider();
  const current = {
    name: currentProvider.name,
    available: currentProvider.isAvailable(),
    reason: currentProvider.isAvailable()
      ? 'Current provider is working correctly'
      : 'Current provider has issues'
  };
  
  const recommendedProvider = sqliteProvider.isAvailable()
    ? sqliteProvider.name
    : mockProvider.name;
  
  return {
    current,
    available: providers,
    recommendation: `Recommended: ${recommendedProvider} for ${ENV.isProduction ? 'production' : 'development'}`
  };
} 