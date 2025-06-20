// Vector Storage Provider Factory with Environment Detection

import { VectorStorageProvider } from './base';
import { CloudflareVectorizeProvider } from './cloudflare-vectorize';
import { MockVectorProvider } from './mock';
import { VectorizeBinding } from './types';
import { ENV, envLog } from '../../../config/environment';

/**
 * Create the appropriate vector storage provider based on environment and availability
 */
export function createVectorStorageProvider(vectorDB?: VectorizeBinding | unknown): VectorStorageProvider {
  envLog(`Creating vector storage provider (mode: ${ENV.vectorStorageMode})`);
  
  // Handle explicit mode override
  if (ENV.vectorStorageMode === 'mock') {
    const mockProvider = new MockVectorProvider();
    envLog(`Using ${mockProvider.name} (forced by VECTOR_STORAGE_MODE=mock)`);
    return mockProvider;
  }
  
  if (ENV.vectorStorageMode === 'cloudflare') {
    const cloudflareProvider = new CloudflareVectorizeProvider(vectorDB);
    if (cloudflareProvider.isAvailable()) {
      envLog(`Using ${cloudflareProvider.name} (forced by VECTOR_STORAGE_MODE=cloudflare)`);
      return cloudflareProvider;
    } else {
      envLog('Cloudflare Vectorize forced but not available, falling back to Mock', 'warn');
      const mockProvider = new MockVectorProvider();
      envLog(`Using ${mockProvider.name} as fallback`);
      return mockProvider;
    }
  }
  
  // Auto mode: Try Cloudflare first, fallback to Mock
  const cloudflareProvider = new CloudflareVectorizeProvider(vectorDB);
  if (cloudflareProvider.isAvailable()) {
    envLog(`Using ${cloudflareProvider.name} (auto-detected)`);
    return cloudflareProvider;
  }
  
  // Fallback to mock provider
  const mockProvider = new MockVectorProvider();
  envLog(`Using ${mockProvider.name} (auto-fallback for ${ENV.environment})`);
  return mockProvider;
}

/**
 * Get provider info without creating an instance
 */
export function getProviderInfo(vectorDB?: VectorizeBinding | unknown): {
  recommendedProvider: string;
  availableProviders: Array<{ name: string; available: boolean; reason: string }>;
  environment: string;
} {
  const cloudflareProvider = new CloudflareVectorizeProvider(vectorDB);
  const mockProvider = new MockVectorProvider();
  
  const availableProviders = [
    {
      name: cloudflareProvider.name,
      available: cloudflareProvider.isAvailable(),
      reason: cloudflareProvider.isAvailable() 
        ? 'Vectorize binding available' 
        : 'Vectorize binding not found or invalid'
    },
    {
      name: mockProvider.name,
      available: mockProvider.isAvailable(),
      reason: 'Always available for development'
    }
  ];
  
  const recommendedProvider = cloudflareProvider.isAvailable() 
    ? cloudflareProvider.name 
    : mockProvider.name;
  
  return {
    recommendedProvider,
    availableProviders,
    environment: ENV.environment
  };
} 