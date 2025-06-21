const Database = require('better-sqlite3');
const { join } = require('path');

// Test the Mastra database vector search
async function testMastraSearch() {
  console.log('🔍 Testing Mastra Database Vector Search...');
  
  const dbPath = join(process.cwd(), '.mastra/output/data/finance.db');
  console.log('📁 Database path:', dbPath);
  
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
  console.log(`📊 Found ${allTransactions.length} transactions in Mastra database`);
  
  if (allTransactions.length === 0) {
    console.log('❌ No transactions found in Mastra database.');
    return;
  }
  
  // Show all transactions
  console.log('\n📋 All transactions:');
  allTransactions.forEach((tx, i) => {
    console.log(`   ${i+1}. ${tx.hebrew_summary} (${tx.category})`);
  });
  
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
  
  // Test searches with different queries
  const testQueries = [
    'בגדים',  // clothing
    'אורבניקה',  // Urbanica
    'מזון',  // food
    'דאבל מרקט',  // Double Market
    'קניות',  // shopping
    'clothing',  // English
    'food'  // English
  ];
  
  for (const searchQuery of testQueries) {
    console.log(`\n🔍 Testing search: "${searchQuery}"`);
    
    // Create a simple query vector (this is just for testing - normally you'd use OpenAI embedding)
    // For this test, let's use the first transaction's embedding as a query
    if (!allTransactions[0].hebrew_embedding) {
      console.log('   ⚠️  No embedding found for first transaction');
      continue;
    }
    
    const queryVector = JSON.parse(allTransactions[0].hebrew_embedding);
    console.log(`   📊 Query vector length: ${queryVector.length}`);
    
    const scoredResults = [];
    
    for (const row of allTransactions) {
      if (!row.hebrew_embedding) continue;
      
      try {
        const hebrewEmbedding = JSON.parse(row.hebrew_embedding);
        const similarity = cosineSimilarity(queryVector, hebrewEmbedding);
        
        scoredResults.push({
          id: row.id,
          hebrewSummary: row.hebrew_summary,
          category: row.category,
          score: similarity
        });
      } catch (e) {
        console.warn(`   ⚠️  Failed to parse embedding for ${row.id}`);
      }
    }
    
    // Sort by similarity
    scoredResults.sort((a, b) => b.score - a.score);
    
    console.log(`   📊 Results (all scores):`);
    scoredResults.forEach((result, i) => {
      console.log(`      ${i+1}. Score: ${result.score.toFixed(4)} - ${result.hebrewSummary} (${result.category})`);
    });
    
    // Check different thresholds
    const thresholds = [0.9, 0.8, 0.7, 0.6, 0.5, 0.3, 0.1];
    console.log(`   🎯 Results by threshold:`);
    thresholds.forEach(threshold => {
      const aboveThreshold = scoredResults.filter(r => r.score >= threshold);
      console.log(`      ≥${threshold}: ${aboveThreshold.length} results`);
    });
  }
  
  db.close();
  console.log('\n✅ Mastra search test completed!');
}

// Run the test
testMastraSearch().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 