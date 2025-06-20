# 🚀 Cloudflare Vectorize Integration for Mastra Finance AI

This project now includes **Cloudflare Vectorize** integration for powerful vector-based transaction similarity search and storage.

## 🎯 What's New

### **✅ Vector Storage**
- Automatic embedding storage in Cloudflare Vectorize
- Metadata indexing for fast filtering
- Optimized for `text-embedding-3-small` (1536 dimensions)

### **✅ Similarity Search**
- Find similar transactions using vector search
- Filter by transaction type, category, amount ranges
- Configurable similarity thresholds

### **✅ Cloud-Native**
- Serverless-ready for Mastra Cloud deployment
- Zero infrastructure management
- Global distribution via Cloudflare's edge network

## 🛠️ Setup Complete

The following has been configured for you:

### **1. Vectorize Index Created**
```bash
✅ Index: finance-transactions (1536 dimensions, cosine similarity)
✅ Metadata indexes: transactionType, category, amount
```

### **2. Wrangler Configuration**
```toml
# wrangler.toml
[[vectorize]]
binding = "FINANCE_VECTORS"
index_name = "finance-transactions"
```

### **3. Updated Tools**
- `transactionAnalyzerTool`: Now stores embeddings in Vectorize
- `vectorSearchTool`: New tool for similarity search

## 🔧 Usage Examples

### **Analyze & Store Transaction**
```typescript
import { transactionAnalyzerTool } from './src/mastra/tools/account-statement';

// In your Mastra Cloud Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const result = await transactionAnalyzerTool.execute({
      context: {
        transactionText: "עירית נתניה הוראת קבע 942.55",
        storeInVector: true,
        vectorDB: env.FINANCE_VECTORS // Cloudflare binding
      }
    });
    
    console.log('Stored with ID:', result.vectorId);
    return Response.json(result);
  }
};
```

### **Search Similar Transactions**
```typescript
import { vectorSearchTool } from './src/mastra/tools/account-statement';

const similarTransactions = await vectorSearchTool.execute({
  context: {
    searchQuery: "תשלום לעיריה", // "payment to municipality"
    vectorDB: env.FINANCE_VECTORS,
    topK: 5,
    minScore: 0.8,
    filters: {
      category: 'municipal',
      minAmount: 500
    }
  }
});

console.log(`Found ${similarTransactions.totalResults} similar transactions`);
```

## 🚀 Deployment to Mastra Cloud

### **1. Environment Variables**
Make sure your `.env` includes:
```bash
OPENAI_API_KEY=your_openai_key
MODEL=gpt-4o
```

### **2. Wrangler Deploy**
```bash
# Deploy to Cloudflare Workers (Mastra Cloud compatible)
npx wrangler deploy

# Check deployment status
npx wrangler tail
```

### **3. Test Vector Operations**
```bash
# Check index status
npx wrangler vectorize info finance-transactions

# List stored vectors (if any)
npx wrangler vectorize list-metadata-index finance-transactions
```

## 📊 Vector Database Schema

### **Stored Metadata**
Each transaction vector includes:
```typescript
{
  hebrewSummary: string;      // Hebrew transaction summary
  englishSummary: string;     // English translation
  transactionType: string;    // Type (regular, standing_order, etc.)
  category: string;           // Category (food, transport, etc.)
  amount: number;             // Transaction amount
  originalText: string;       // Original bank text
  createdAt: string;          // ISO timestamp
  embeddingModel: string;     // "text-embedding-3-small"
}
```

### **Searchable Filters**
- `transactionType`: Exact match on transaction type
- `category`: Exact match on category
- `amount`: Range queries (min/max)

## 🎯 Benefits

### **🚀 Performance**
- **Sub-100ms** vector similarity search
- **Global CDN** distribution via Cloudflare
- **Automatic scaling** with usage

### **💰 Cost-Effective**
- **Pay-per-query** pricing model
- **No infrastructure** costs
- **Efficient storage** with metadata indexing

### **🔍 Powerful Search**
- **Semantic similarity** beyond keyword matching
- **Multi-language support** (Hebrew + English)
- **Complex filtering** with metadata

## 🔧 Configuration Options

### **Similarity Thresholds**
- `0.9-1.0`: Nearly identical transactions
- `0.8-0.9`: Very similar transactions  
- `0.7-0.8`: Somewhat similar transactions
- `0.6-0.7`: Loosely related transactions

### **Search Strategies**
```typescript
// Find exact duplicates
{ minScore: 0.95, topK: 3 }

// Find similar merchants
{ minScore: 0.8, filters: { category: 'food' } }

// Find amount ranges
{ minScore: 0.7, filters: { minAmount: 100, maxAmount: 500 } }
```

## 🐛 Troubleshooting

### **Common Issues**

1. **No results found**: Lower `minScore` threshold
2. **Too many results**: Increase `minScore` or add filters
3. **Binding error**: Check `wrangler.toml` configuration
4. **Embedding fails**: Verify `OPENAI_API_KEY` is set

### **Debug Commands**
```bash
# Check Vectorize status
npx wrangler vectorize info finance-transactions

# View recent logs
npx wrangler tail

# Test embedding generation
node -e "console.log('Testing OpenAI API:', !!process.env.OPENAI_API_KEY)"
```

## 🚀 Next Steps

1. **Deploy to production**: `npx wrangler deploy`
2. **Monitor usage**: Check Cloudflare dashboard
3. **Scale up**: Add more metadata indexes as needed
4. **Integrate**: Connect with your Mastra agents and workflows

---

**🎉 Your Mastra Finance AI now has powerful vector search capabilities!** 