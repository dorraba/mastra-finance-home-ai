# 🚀 Environment Setup Guide

This guide will help you set up the Mastra Finance AI project for development using Cloudflare Vectorize for vector storage.

## 📋 **Quick Setup**

### **1. Environment Variables**

Create a `.env` file in your project root:

```bash
# OPENAI CONFIGURATION (Required)
OPENAI_API_KEY=your_openai_api_key_here

# CLOUDFLARE VECTORIZE CONFIGURATION (Required)
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_API_TOKEN=your_cloudflare_api_token

# VECTOR STORAGE CONFIGURATION
# Only Cloudflare Vectorize is supported
VECTOR_STORAGE_MODE=cloudflare

# OPTIONAL: Override the default AI model
MODEL=gpt-4o
```

### **2. OpenAI API Key**

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key and add it to your `.env` file

### **3. Cloudflare Vectorize Setup**

1. **Get your Account ID:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Copy your Account ID from the right sidebar

2. **Create an API Token:**
   - Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token"
   - Use "Custom token" template
   - Set permissions:
     - `Cloudflare Workers:Edit`
     - `Account:Read` 
     - `Zone:Read`
   - Add your account to "Account Resources"
   - Click "Continue to summary" and "Create Token"
   - Copy the token and add it to your `.env` file

## 🏗️ **Vector Storage**

The application uses **Cloudflare Vectorize** exclusively for vector storage:

- **Serverless**: No infrastructure to manage
- **Scalable**: Handles millions of vectors automatically  
- **Global**: Edge-optimized for low latency worldwide
- **Integrated**: Works seamlessly with Cloudflare Workers

## 🧪 **Testing Your Setup**

Test your Cloudflare Vectorize connection:

```bash
# Test Cloudflare Vectorize setup
node test-cloudflare.js
```

Once you have your environment configured:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"No embedding generated" errors**
   - Check your `OPENAI_API_KEY` is set correctly
   - Ensure you have sufficient OpenAI API credits

2. **Cloudflare Vectorize errors**
   - Verify your `CF_ACCOUNT_ID` and `CF_API_TOKEN` are correct
   - Ensure your API token has the required permissions
   - Check that Vectorize is enabled for your Cloudflare account

3. **Index creation failures**
   - Vectorize indexes are created automatically
   - Check your Cloudflare dashboard for existing indexes
   - Ensure you haven't exceeded your plan's index limits

## 📊 **Cloudflare Vectorize Features**

- **Serverless**: No infrastructure to manage
- **Scalable**: Handles millions of vectors
- **Fast**: Global edge network for low latency
- **Cost-effective**: Pay only for what you use
- **Integrated**: Works seamlessly with Cloudflare Workers

## 📚 **Next Steps**

1. 🔑 Set up your API keys (OpenAI + Cloudflare)
2. 🧪 Test your setup with `node test-cloudflare.js`
3. 🚀 Run `npm run dev` to start developing
4. 📊 Explore transaction analysis in the Mastra playground
5. 🔍 Test vector search functionality

## 🆘 **Getting Help**

If you encounter issues:

1. Check the [Cloudflare Vectorize documentation](https://developers.cloudflare.com/vectorize/)
2. Verify your environment variables are set correctly
3. Test the connection with the provided test script
4. Check the Mastra development console for detailed error messages 