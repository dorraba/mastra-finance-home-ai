# 🏦 Mastra Finance AI

An intelligent financial transaction analysis system built with the Mastra framework and Cloudflare Vectorize. This application can analyze bank statements, extract transaction data, and provide semantic search capabilities over financial records.

## 🌟 Overview

The Mastra Finance AI demonstrates how to:

- 🔍 **Analyze Financial Transactions**: Extract and categorize transactions from bank statements
- 🧠 **Generate Smart Summaries**: Create Hebrew and English summaries using OpenAI
- 📊 **Vector Search**: Find similar transactions using semantic embeddings
- ☁️ **Scale with Cloudflare**: Leverage Cloudflare Vectorize for serverless vector storage
- 🎯 **Intelligent Categorization**: Automatically classify transaction types and categories

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Cloudflare account with Vectorize access

### Setup

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd mastra-finance-home-ai
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Required Environment Variables**:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   CF_ACCOUNT_ID=your_cloudflare_account_id
   CF_API_TOKEN=your_cloudflare_api_token
   VECTOR_STORAGE_MODE=cloudflare
   ```

4. **Test Setup**:
   ```bash
   node test-cloudflare.js
   ```

5. **Start Development**:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

### Core Components

- **Transaction Analyzer**: Processes bank statements and extracts transaction data
- **Vector Search**: Semantic search over transaction embeddings
- **Cloudflare Vectorize**: Serverless vector database for scalable storage
- **OpenAI Integration**: GPT-4 for analysis and text-embedding-3-small for vectors

### Cloudflare Vectorize

The application uses Cloudflare Vectorize exclusively for vector storage:

- **Production-Ready**: Serverless vector database built for scale
- **Global Performance**: Edge-optimized for low latency worldwide
- **Zero Maintenance**: No infrastructure to manage or maintain

## 📚 Documentation

- [Environment Setup Guide](ENVIRONMENT-SETUP.md) - Complete setup instructions

- [Database Information](database-info.md) - Vector storage details

## 🧪 Testing

Test your setup with the included scripts:

```bash
# Test Cloudflare Vectorize connection
node test-cloudflare.js

# Test full transaction analysis flow
node test-full-flow.cjs
```

## 🔧 Configuration

### Vector Storage

The application uses Cloudflare Vectorize exclusively for all vector operations including storage, similarity search, and metadata filtering.

### Embedding Model

The application uses OpenAI's `text-embedding-3-small` (1536 dimensions) for generating vector embeddings of transaction summaries.

## 🌍 Deployment

The application is designed to work seamlessly in:

- **Local Development**: Full functionality with Cloudflare Vectorize
- **Cloudflare Workers**: Native integration with Vectorize
- **Cloud Platforms**: Serverless-ready architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For help and support:

- Check the [Environment Setup Guide](ENVIRONMENT-SETUP.md)
- Review the [Cloudflare Vectorize documentation](https://developers.cloudflare.com/vectorize/)
- Test your setup with the provided test scripts
