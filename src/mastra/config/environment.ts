// Environment Configuration for Mastra Finance AI

export interface Environment {
  openaiApiKey: string;
  isProduction: boolean;
  vectorStorageMode: 'mock' | 'sqlite' | 'auto';
}

/**
 * Simple logging function for environment configuration
 */
function envLog(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const prefix = process.env.NODE_ENV === 'production' ? '🚀 [PROD]' : '🔧 [DEV]';
  const logMessage = `${prefix} ${message}`;
  
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

/**
 * Load and validate environment variables
 */
export function loadEnvironment(): Environment {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  
  // Determine vector storage mode
  const mode = process.env.VECTOR_STORAGE_MODE?.toLowerCase();
  let vectorStorageMode: 'mock' | 'sqlite' | 'auto' = 'auto';
  
  envLog(`Raw VECTOR_STORAGE_MODE: "${process.env.VECTOR_STORAGE_MODE}"`);
  
  if (mode === 'mock' || mode === 'sqlite') {
    vectorStorageMode = mode;
    envLog(`Vector storage mode set to: ${vectorStorageMode}`);
  } else if (mode && mode !== 'auto') {
    envLog(`Invalid VECTOR_STORAGE_MODE "${mode}". Valid options: mock, sqlite, auto. Defaulting to auto.`, 'warn');
  } else {
    envLog(`Vector storage mode: auto (will choose best available provider)`);
  }

  return {
    openaiApiKey,
    isProduction,
    vectorStorageMode,
  };
}

// Global environment instance
export const ENV = loadEnvironment(); 