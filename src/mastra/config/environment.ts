// Environment Configuration for Mastra Finance AI - Cloudflare Only

export interface Environment {
  openaiApiKey: string;
  isProduction: boolean;
  cloudflareAccountId: string;
  cloudflareApiToken: string;
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
  
  // Get required Cloudflare credentials
  const cloudflareAccountId = process.env.CF_ACCOUNT_ID;
  const cloudflareApiToken = process.env.CF_API_TOKEN;
  
  if (!cloudflareAccountId || !cloudflareApiToken) {
    throw new Error(
      'Cloudflare credentials are required. Please set CF_ACCOUNT_ID and CF_API_TOKEN environment variables.\n' +
      'See ENVIRONMENT-SETUP.md for setup instructions.'
    );
  }
  
  envLog(`Cloudflare Vectorize credentials configured`);
  envLog(`Account ID: ${cloudflareAccountId.substring(0, 8)}...`);
  envLog(`API Token: ${cloudflareApiToken.substring(0, 8)}...`);

  return {
    openaiApiKey,
    isProduction,
    cloudflareAccountId,
    cloudflareApiToken,
  };
}

// Global environment instance
export const ENV = loadEnvironment(); 