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
 * Get the global Mastra logger instance
 */
function getMastraLogger() {
  try {
    // Try to access the global Mastra instance
    const globalThis_ = globalThis as any;
    return globalThis_?.mastra?.logger || globalThis_?.logger;
  } catch {
    return null;
  }
}

/**
 * Environment-specific logging using Mastra's global logger
 */
export function envLog(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const config = getEnvironmentConfig();
  const prefix = config.isDevelopment ? '🔧 [DEV]' : '🚀 [PROD]';
  const logMessage = `${prefix} ${message}`;
  
  const logger = getMastraLogger();
  
  if (logger) {
    // Use Mastra's logger if available
    switch (level) {
      case 'info':
        logger.info(logMessage);
        break;
      case 'warn':
        logger.warn(logMessage);
        break;
      case 'error':
        logger.error(logMessage);
        break;
    }
  } else {
    // Fallback to console logging for development
    switch (level) {
      case 'info':
        console.log(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }
  }
}

// Export a singleton instance
export const ENV = getEnvironmentConfig(); 