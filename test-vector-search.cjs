const Database = require('better-sqlite3');
const { join } = require('path');

// Test the vector search functionality
async function testVectorSearch() {
  console.log('🔍 Testing Vector Search with Real Similarity...');
  
  const dbPath = join(process.cwd(), 'data', 'finance.db');
  const db = new Database(dbPath);
  
  // Get all transactions with embeddings
  const getAllTransactions = db.prepare(`
    SELECT 
      t.*,
      he.embedding_vector as hebrew_embedding,
      ee.embedding_vector as english_embedding
    FROM transactions t
    LEFT JOIN transaction_embeddings he ON t.id = he.transaction_id AND he.embedding_type = 'hebrew'
    LEFT JOIN transaction_embeddings ee ON t.id = ee.transaction_id AND ee.embedding_type = 'english'
    ORDER BY t.created_at DESC
  `);

  const allTransactions = getAllTransactions.all();
  console.log(`📊 Found ${allTransactions.length} transactions in database`);
  
  if (allTransactions.length === 0) {
    console.log('❌ No transactions found. Please run the transaction analyzer first.');
    return;
  }
  
  // Test cosine similarity function
  function cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  // Test with different query vectors
  const testQueries = [
    { name: 'Similar to existing', vector: null }, // We'll use the first transaction's embedding
    { name: 'Random vector', vector: new Array(1536).fill(0).map(() => Math.random() * 2 - 1) },
    { name: 'Zero vector', vector: new Array(1536).fill(0) },
    { name: 'Ones vector', vector: new Array(1536).fill(1) }
  ];
  
  // Use the first transaction's embedding as a test query
  if (allTransactions[0].hebrew_embedding) {
    testQueries[0].vector = JSON.parse(allTransactions[0].hebrew_embedding);
  }
  
  for (const query of testQueries) {
    if (!query.vector) continue;
    
    console.log(`\n🧪 Testing: ${query.name}`);
    console.log(`   Query vector length: ${query.vector.length}`);
    
    const scoredResults = [];
    
    for (const row of allTransactions) {
      if (!row.hebrew_embedding) continue;
      
      try {
        const hebrewEmbedding = JSON.parse(row.hebrew_embedding);
        const similarity = cosineSimilarity(query.vector, hebrewEmbedding);
        
        scoredResults.push({
          id: row.id,
          hebrewSummary: row.hebrew_summary,
          englishSummary: row.english_summary,
          score: similarity
        });
      } catch (e) {
        console.warn(`   ⚠️  Failed to parse embedding for ${row.id}`);
      }
    }
    
    // Sort by similarity
    scoredResults.sort((a, b) => b.score - a.score);
    
    console.log(`   📊 Results (top 3):`);
    scoredResults.slice(0, 3).forEach((result, i) => {
      console.log(`      ${i+1}. Score: ${result.score.toFixed(4)} - ${result.hebrewSummary}`);
    });
  }
  
  db.close();
  console.log('\n✅ Vector search test completed!');
}

// Run the test
testVectorSearch().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 