// Test Cloudflare Vectorize Implementation
import { CloudflareVector } from '@mastra/vectorize';

async function testCloudflareVectorize() {
  console.log('🧪 Testing Cloudflare Vectorize Implementation...');
  
  // Check environment variables
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;
  
  if (!accountId || !apiToken) {
    console.error('❌ Missing CF_ACCOUNT_ID or CF_API_TOKEN environment variables');
    console.log('Please set these environment variables:');
    console.log('  CF_ACCOUNT_ID=your_cloudflare_account_id');
    console.log('  CF_API_TOKEN=your_cloudflare_api_token');
    return;
  }
  
  console.log(`✅ Cloudflare credentials found`);
  console.log(`   Account ID: ${accountId.substring(0, 8)}...`);
  console.log(`   API Token: ${apiToken.substring(0, 8)}...`);
  
  try {
    // Initialize Cloudflare Vector store
    const store = new CloudflareVector({
      accountId,
      apiToken
    });
    
    const indexName = 'finance-transactions-test';
    const dimension = 1536; // text-embedding-3-small dimension
    
    console.log(`\n📦 Creating index "${indexName}" with dimension ${dimension}...`);
    
    // Create index
    await store.createIndex({
      indexName,
      dimension
    });
    
    console.log('✅ Index created successfully');
    
    // Test data
    const testVectors = [
      Array(dimension).fill(0.1),
      Array(dimension).fill(0.2),
      Array(dimension).fill(0.3)
    ];
    
    const testMetadata = [
      { text: 'Test transaction 1', category: 'food', amount: 25.50 },
      { text: 'Test transaction 2', category: 'transport', amount: 12.00 },
      { text: 'Test transaction 3', category: 'entertainment', amount: 45.75 }
    ];
    
    const testIds = ['test-1', 'test-2', 'test-3'];
    
    console.log(`\n📤 Upserting ${testVectors.length} test vectors...`);
    
    // Upsert vectors
    await store.upsert({
      indexName,
      vectors: testVectors,
      metadata: testMetadata,
      ids: testIds
    });
    
    console.log('✅ Vectors upserted successfully');
    
    // Test query
    const queryVector = Array(dimension).fill(0.15);
    
    console.log(`\n🔍 Querying for similar vectors...`);
    
    const results = await store.query({
      indexName,
      queryVector,
      topK: 5,
      includeVector: false
    });
    
    console.log(`✅ Query completed successfully`);
    console.log(`📊 Found ${results.length} results:`);
    
    results.forEach((result, i) => {
      console.log(`   ${i + 1}. ID: ${result.id}, Score: ${result.score?.toFixed(4)}`);
      console.log(`      Metadata: ${JSON.stringify(result.metadata)}`);
    });
    
    // Clean up - delete the test index
    console.log(`\n🗑️  Cleaning up test index...`);
    try {
      await store.deleteIndex({ indexName });
      console.log('✅ Test index deleted successfully');
    } catch (error) {
      console.log('ℹ️  Could not delete test index (may not exist)');
    }
    
    console.log('\n🎉 All tests passed! Cloudflare Vectorize is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCloudflareVectorize().catch(console.error); 