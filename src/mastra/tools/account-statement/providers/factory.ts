// Vector Storage Provider Factory - Cloudflare Vectorize Only

import { VectorStorageProvider } from './base';
import { CloudflareVectorizeProvider } from './cloudflare';
import { ENV } from '../../../config/environment';

/**
 * Create Cloudflare Vectorize provider - the only supported provider
 */
export function createVectorStorageProvider(): VectorStorageProvider {
  console.log('🏗️  Creating Cloudflare Vectorize provider...');
  console.log(`Environment: ${ENV.isProduction ? 'production' : 'development'}`);
  
  // Validate Cloudflare credentials
  if (!ENV.cloudflareAccountId || !ENV.cloudflareApiToken) {
    throw new Error(
      '❌ Cloudflare credentials are required. Please set CF_ACCOUNT_ID and CF_API_TOKEN environment variables.\n' +
      'See ENVIRONMENT-SETUP.md for configuration instructions.'
    );
  }
  
  console.log('☁️ Using Cloudflare Vectorize provider');
  return new CloudflareVectorizeProvider(ENV.cloudflareAccountId, ENV.cloudflareApiToken);
}

/**
 * Get information about the Cloudflare provider
 */
export function getProviderInfo(): {
  current: { name: string; available: boolean; reason: string };
  recommendation: string;
} {
  const cloudflareProvider = ENV.cloudflareAccountId && ENV.cloudflareApiToken 
    ? new CloudflareVectorizeProvider(ENV.cloudflareAccountId, ENV.cloudflareApiToken)
    : null;
  
  if (!cloudflareProvider) {
    return {
      current: {
        name: 'None',
        available: false,
        reason: 'Cloudflare credentials not configured'
      },
      recommendation: 'Configure CF_ACCOUNT_ID and CF_API_TOKEN environment variables'
    };
  }
  
  return {
    current: {
      name: cloudflareProvider.name,
      available: cloudflareProvider.isAvailable(),
      reason: cloudflareProvider.isAvailable()
        ? 'Cloudflare Vectorize credentials configured and ready'
        : 'Cloudflare credentials invalid or Vectorize not available'
    },
    recommendation: `Using Cloudflare Vectorize for ${ENV.isProduction ? 'production' : 'development'}`
  };
} 