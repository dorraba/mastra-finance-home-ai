// Vector Storage Provider Factory with Environment Detection

import { VectorStorageProvider } from './base';
import { CloudflareVectorizeProvider } from './cloudflare-vectorize';
import { MockVectorProvider } from './mock';
import { VectorizeBinding } from './types';
import { ENV, envLog } from '../../../config/environment';

/**
 * Create a Vectorize client using Cloudflare API when bindings aren't available
 */
function createVectorizeAPIClient(): VectorizeBinding | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  
  if (!accountId || !apiToken) {
    envLog('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN for API client', 'warn');
    return null;
  }
  
  envLog('Creating Vectorize API client with account ID and token');
  
  // Create a Vectorize client that uses the REST API
  return {
    async insert(vectors) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/indexes/finance-transactions/insert`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vectors }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Vectorize insert failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return { mutationId: result.result?.mutationId || 'api_insert' };
    },
    
    async query(vector, options = {}) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/indexes/finance-transactions/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vector,
            topK: options.topK || 5,
            returnValues: options.returnValues || false,
            returnMetadata: options.returnMetadata || 'all',
            filter: options.filter,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Vectorize query failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return { matches: result.result?.matches || [] };
    },
  };
}

/**
 * Create the appropriate vector storage provider based on environment and availability
 */
export function createVectorStorageProvider(vectorDB?: VectorizeBinding | unknown): VectorStorageProvider {
  envLog(`Creating vector storage provider (env: ${ENV.environment}, mode: ${ENV.vectorStorageMode})`);
  
  // Handle explicit mock mode
  if (ENV.vectorStorageMode === 'mock') {
    const mockProvider = new MockVectorProvider();
    envLog(`Using ${mockProvider.name} (forced by VECTOR_STORAGE_MODE=mock)`);
    return mockProvider;
  }
  
  // In production or when explicitly set to cloudflare, use API client
  if (ENV.isProduction || ENV.vectorStorageMode === 'cloudflare') {
    envLog('Creating Cloudflare Vectorize API client for production');
    const apiClient = createVectorizeAPIClient();
    
    if (!apiClient) {
      const errorMsg = 'Cloudflare Vectorize API client could not be created. Check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.';
      envLog(errorMsg, 'error');
      throw new Error(errorMsg);
    }
    
    const cloudflareProvider = new CloudflareVectorizeProvider(apiClient);
    envLog(`Using ${cloudflareProvider.name} (API client)`);
    return cloudflareProvider;
  }
  
  // Development mode: try API client first, fall back to mock
  envLog('Development mode: attempting to use Cloudflare API client');
  const apiClient = createVectorizeAPIClient();
  
  if (apiClient) {
    const cloudflareProvider = new CloudflareVectorizeProvider(apiClient);
    envLog(`Using ${cloudflareProvider.name} (API client in development)`);
    return cloudflareProvider;
  }
  
  // Fall back to mock in development only
  const mockProvider = new MockVectorProvider();
  envLog(`Using ${mockProvider.name} (development fallback - missing Cloudflare credentials)`);
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