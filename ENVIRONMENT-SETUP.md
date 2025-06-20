# 🔧 Environment Setup Guide

## 📋 **Required Environment Variables**

### **1. Local Development (.env file)**

Create a `.env` file in your project root with:

```env
# =============================================================================
# OPENAI CONFIGURATION (Required)
# =============================================================================
OPENAI_API_KEY=your_openai_api_key_here

# =============================================================================
# CLOUDFLARE CONFIGURATION (Optional for local dev)
# =============================================================================
CLOUDFLARE_ACCOUNT_ID=d3b20a1a492d8fa7cc5c4bd86d4c8bbc
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here

# =============================================================================
# VECTOR STORAGE CONFIGURATION
# =============================================================================
# Force vector storage mode (optional)
# Values: "cloudflare" | "mock" | "auto"
VECTOR_STORAGE_MODE=mock

# =============================================================================
# DEVELOPMENT CONFIGURATION
# =============================================================================
NODE_ENV=development
```

### **2. Mastra Cloud Production**

In your Mastra Cloud environment, set these variables:

```env
# =============================================================================
# OPENAI CONFIGURATION
# =============================================================================
OPENAI_API_KEY=your_openai_api_key_here

# =============================================================================
# CLOUDFLARE CONFIGURATION
# =============================================================================
CLOUDFLARE_ACCOUNT_ID=d3b20a1a492d8fa7cc5c4bd86d4c8bbc
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here

# =============================================================================
# VECTOR STORAGE CONFIGURATION
# =============================================================================
VECTOR_STORAGE_MODE=cloudflare
NODE_ENV=production
```

## 🔑 **How to Get Your API Keys**

### **1. OpenAI API Key**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys section
3. Create a new API key
4. Copy and paste into your `.env` file

### **2. Cloudflare API Token**
1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. **Required Permissions**:
   - Account: `Cloudflare Workers:Edit`
   - Account: `Account:Read` 
   - Zone: `Zone:Read`
5. **Account Resources**: Include your account (`Dor.raba@gmail.com's Account`)
6. Copy the generated token

## 🏗️ **Vectorize Database Setup**

Your Vectorize database is already created! ✅

- **Name**: `finance-transactions`
- **Dimensions**: 1536 (for text-embedding-3-small)
- **Metric**: cosine similarity
- **Account ID**: `d3b20a1a492d8fa7cc5c4bd86d4c8bbc`

## 🚀 **Testing Your Setup**

### **Local Development**
```bash
# 1. Install dependencies
npm install

# 2. Start Mastra development server
npx mastra dev

# 3. Open playground
# http://localhost:4111
```

### **Production Deployment**
```bash
# Deploy to Mastra Cloud
npx mastra deploy
```

## 🔧 **Environment Detection Logic**

The system automatically detects your environment:

- **Mock Mode** (`VECTOR_STORAGE_MODE=mock`): Uses mock vector storage (no real database calls)
- **Cloudflare Mode** (`VECTOR_STORAGE_MODE=cloudflare`): Uses Cloudflare Vectorize database
- **Auto Mode** (`VECTOR_STORAGE_MODE=auto`): Automatically detects based on environment
- **Override**: Set `VECTOR_STORAGE_MODE` to force a specific mode

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"Vectorize not available" errors**
   - Check your `CLOUDFLARE_API_TOKEN` is set correctly
   - Verify your account ID matches: `d3b20a1a492d8fa7cc5c4bd86d4c8bbc`

2. **Embedding errors**
   - Verify your `OPENAI_API_KEY` is valid and has credits
   - Check you're using the correct model: `text-embedding-3-small`

3. **Local development issues**
   - Set `VECTOR_STORAGE_MODE=mock` to use mock storage
   - Check console logs for environment detection messages

### **Verification Commands**

```bash
# Check Vectorize database exists
npx wrangler vectorize list

# Test Vectorize connection
npx wrangler vectorize info finance-transactions

# Check authentication
npx wrangler whoami
```

## 📊 **Dashboard Access**

**Note**: The Vectorize dashboard UI might not be available in all regions yet, but your database is working perfectly via API/CLI. You can manage everything through:

- **CLI**: `npx wrangler vectorize --help`
- **Your application**: The tools will work seamlessly
- **Logs**: Check Mastra logs for vector operations

## 🎯 **Next Steps**

1. ✅ Database is ready (`finance-transactions`)
2. 🔑 Set up your API keys (OpenAI + Cloudflare)
3. 🚀 Test locally with `npx mastra dev`
4. 🌐 Deploy to production with `npx mastra deploy` 