// Environment Configuration for Mastra Finance AI

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  environment: 'development' | 'production' | 'test';
  vectorStorageMode: 'cloudflare' | 'mock' | 'auto';
}

/**
 * Detect the current environment based on various indicators
 */
function detectEnvironment(): 'development' | 'production' | 'test' {
  // Check NODE_ENV first
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  
  // Check for Cloudflare Workers environment
  if (typeof globalThis.caches !== 'undefined' && typeof globalThis.Request !== 'undefined') {
    return 'production';
  }
  
  // Check for Mastra dev environment
  if (process.env.MASTRA_DEV === 'true' || process.argv.includes('dev')) {
    return 'development';
  }
  
  // Check for localhost or local development indicators
  if (
    process.env.HOSTNAME === 'localhost' ||
    process.env.HOST === 'localhost' ||
    process.env.VERCEL_ENV === 'development' ||
    process.env.CF_PAGES_BRANCH === 'preview'
  ) {
    return 'development';
  }
  
  // Default to development for safety
  return 'development';
}

/**
 * Get the current environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = detectEnvironment();
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';
  
  // Determine vector storage mode
  let vectorStorageMode: 'cloudflare' | 'mock' | 'auto' = 'auto';
  
  if (process.env.VECTOR_STORAGE_MODE) {
    const mode = process.env.VECTOR_STORAGE_MODE.toLowerCase();
    if (mode === 'cloudflare' || mode === 'mock') {
      vectorStorageMode = mode;
    }
  }
  
  return {
    isDevelopment,
    isProduction,
    environment,
    vectorStorageMode
  };
}

/**
 * Environment-specific logging
 */
export function envLog(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const config = getEnvironmentConfig();
  const prefix = config.isDevelopment ? '🔧 [DEV]' : '🚀 [PROD]';
  
  switch (level) {
    case 'info':
      console.log(`${prefix} ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`);
      break;
    case 'error':
      console.error(`${prefix} ${message}`);
      break;
  }
}

// Export a singleton instance
export const ENV = getEnvironmentConfig(); 