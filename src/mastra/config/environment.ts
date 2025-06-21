// Environment Configuration for Mastra Finance AI

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  environment: 'development' | 'production' | 'test';
  vectorStorageMode: 'cloudflare' | 'mock' | 'auto';
}

/**
 * Detect the current environment based on NODE_ENV
 */
function detectEnvironment(): 'development' | 'production' | 'test' {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  
  if (nodeEnv === 'production') {
    return 'production';
  }
  
  if (nodeEnv === 'test') {
    return 'test';
  }
  
  // Default to development (includes undefined, 'development', or any other value)
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