# 📊 Database Information - Cloudflare Vectorize

This document provides detailed information about the vector database setup using Cloudflare Vectorize for the Mastra Finance AI project.

## 🏗️ **Architecture Overview**

The application uses **Cloudflare Vectorize**, a serverless vector database that provides:

- **Global Distribution**: Vectors stored across Cloudflare's global network
- **Serverless Scaling**: Automatically scales based on usage
- **Low Latency**: Edge-optimized for fast query responses
- **Cost Effective**: Pay only for what you use
- **Zero Maintenance**: No infrastructure to manage

## 📋 **Index Configuration**

### **Primary Index: `finance-transactions`**

- **Dimension**: 1536 (matches OpenAI text-embedding-3-small)
- **Distance Metric**: Cosine similarity (default)
- **Purpose**: Stores transaction analysis embeddings

### **Vector Structure**

Each vector record contains:

```typescript
interface VectorRecord {
  id: string;                    // Unique transaction ID
  values: number[];              // 1536-dimensional embedding
  metadata: {
    hebrewSummary: string;       // Hebrew transaction summary
    englishSummary: string;      // English transaction summary
    transactionType: string;     // "income" | "expense" | "transfer"
    category: string;            // Transaction category
    amount: number;              // Transaction amount
    originalText: string;        // Original transaction text
    createdAt: string;           // ISO timestamp
    embeddingModel: string;      // "text-embedding-3-small"
  };
}
```

## 🔍 **Search Capabilities**

### **Semantic Search**

The vector search supports:

- **Similarity Queries**: Find transactions similar to a given text
- **Metadata Filtering**: Filter by category, type, amount ranges
- **Top-K Results**: Configurable result count (default: 5)
- **Score Thresholds**: Filter by similarity scores

### **Query Example**

```typescript
const results = await store.query({
  indexName: 'finance-transactions',
  queryVector: embeddingVector,
  topK: 5,
  filter: {
    category: { $eq: 'food' },
    amount: { $gte: 10, $lte: 100 }
  }
});
```

## 🚀 **Performance Characteristics**

### **Query Performance**

- **Latency**: ~50-200ms globally (edge-optimized)
- **Throughput**: Scales automatically with demand
- **Accuracy**: Cosine similarity with 32-bit float precision

### **Storage Limits**

- **Vectors per Index**: Up to 5M vectors (Worker plan)
- **Metadata Size**: Up to 8KB per vector
- **Index Count**: Multiple indexes supported

## 🔧 **Configuration**

### **Environment Variables**

```bash
# Required for Cloudflare Vectorize
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
VECTOR_STORAGE_MODE=cloudflare
```

### **API Token Permissions**

Your Cloudflare API token needs:

- `Cloudflare Workers:Edit` - For Vectorize operations
- `Account:Read` - For account access
- `Zone:Read` - For zone access (if applicable)

## 📊 **Monitoring & Analytics**

### **Cloudflare Dashboard**

Monitor your vector database through:

- **Vectorize Analytics**: Query volume, latency, errors
- **Usage Metrics**: Storage consumption, API calls
- **Performance Insights**: Regional performance data

### **Application Logging**

The application logs:

- Vector insertions with success/failure status
- Query performance and result counts
- Error details for troubleshooting

## 🔄 **Data Management**

### **Backup & Recovery**

- **Automatic Replication**: Cloudflare handles data replication
- **No Manual Backups**: Serverless infrastructure managed by Cloudflare
- **Data Export**: Use query API to export data if needed

### **Index Management**

```typescript
// Create index
await store.createIndex({
  indexName: 'finance-transactions',
  dimension: 1536
});

// Delete index (careful!)
await store.deleteIndex({
  indexName: 'finance-transactions'
});
```

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Authentication Errors**
   - Verify `CF_ACCOUNT_ID` and `CF_API_TOKEN`
   - Check API token permissions
   - Ensure Vectorize is enabled for your account

2. **Index Not Found**
   - Indexes are created automatically on first use
   - Check Cloudflare dashboard for existing indexes
   - Verify index name matches configuration

3. **Query Timeouts**
   - Large result sets may take longer
   - Consider reducing `topK` parameter
   - Check network connectivity

### **Error Codes**

- `1005`: Unknown content type (check request format)
- `1006`: Invalid vector dimension
- `1007`: Index not found
- `1008`: Rate limit exceeded

## 📈 **Scaling Considerations**

### **Performance Optimization**

- **Batch Operations**: Group multiple upserts for efficiency
- **Metadata Indexing**: Create indexes for frequently filtered fields
- **Query Optimization**: Use appropriate `topK` values

### **Cost Management**

- **Query Optimization**: Efficient queries reduce costs
- **Storage Cleanup**: Remove old/unused vectors
- **Monitoring**: Track usage through Cloudflare dashboard

## 🔗 **Related Resources**

- [Cloudflare Vectorize Documentation](https://developers.cloudflare.com/vectorize/)
- [Mastra Vectorize Package](https://github.com/mastra-ai/mastra)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Environment Setup Guide](ENVIRONMENT-SETUP.md) 