const Database = require('better-sqlite3');
const { join } = require('path');

// Mock the OpenAI embedding results for testing
const mockEmbedding1 = new Array(1536).fill(0).map(() => Math.random());
const mockEmbedding2 = new Array(1536).fill(0).map(() => Math.random());

// Simulate the full transaction analysis flow
async function testFullTransactionFlow() {
  console.log('🧪 Testing Full Transaction Analysis Flow with SQLite...');
  
  // Setup database
  const dbPath = join(process.cwd(), 'data', 'finance.db');
  const db = new Database(dbPath);
  
  // Create our helper functions
  const insertTransaction = (data) => {
    const insertTx = db.prepare(`
      INSERT INTO transactions (
        id, original_text, hebrew_summary, english_summary, 
        transaction_type, category, amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertEmbedding = db.prepare(`
      INSERT INTO transaction_embeddings (transaction_id, embedding_type, embedding_vector)
      VALUES (?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertTx.run(
        data.id,
        data.originalText,
        data.hebrewSummary,
        data.englishSummary,
        data.transactionType,
        data.category,
        data.amount
      );

      insertEmbedding.run(
        data.id,
        'hebrew',
        JSON.stringify(data.hebrewEmbedding)
      );

      insertEmbedding.run(
        data.id,
        'english',
        JSON.stringify(data.englishEmbedding)
      );
    });

    transaction();
  };
  
  // Test data simulating the Mastra tool output
  const transactionData = {
    id: `transaction_${Date.now()}_test`,
    originalText: "27/8/24 אורבניקה ₪ 35.00 ₪ 35.00 רגילה אופנה",
    hebrewSummary: "רכישה בחנות אורבניקה בסך 35 שקלים עבור בגדים ואופנה יפה ומעוצבת",
    englishSummary: "Purchase at Urbanica store for 35 NIS for clothing and fashion items",
    transactionType: "regular",
    category: "clothing_shoes",
    amount: 35.0,
    hebrewEmbedding: mockEmbedding1,
    englishEmbedding: mockEmbedding2
  };
  
  console.log('📝 Inserting transaction analysis result...');
  console.log('   Hebrew Summary:', transactionData.hebrewSummary);
  console.log('   English Summary:', transactionData.englishSummary);
  console.log('   Type:', transactionData.transactionType);
  console.log('   Category:', transactionData.category);
  console.log('   Amount:', transactionData.amount);
  
  // Insert the transaction
  insertTransaction(transactionData);
  
  console.log('✅ Transaction inserted successfully!');
  
  // Query back the results
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
  
  console.log('\n📊 Database Contents:');
  console.log('Total transactions:', allTransactions.length);
  
  allTransactions.forEach((tx, index) => {
    console.log(`\n${index + 1}. Transaction ID: ${tx.id}`);
    console.log(`   Original: ${tx.original_text}`);
    console.log(`   Hebrew: ${tx.hebrew_summary}`);
    console.log(`   English: ${tx.english_summary}`);
    console.log(`   Type: ${tx.transaction_type}`);
    console.log(`   Category: ${tx.category}`);
    console.log(`   Amount: ${tx.amount}`);
    console.log(`   Created: ${tx.created_at}`);
    
    // Check embeddings
    if (tx.hebrew_embedding) {
      const hebrewEmb = JSON.parse(tx.hebrew_embedding);
      console.log(`   Hebrew embedding dimensions: ${hebrewEmb.length}`);
      console.log(`   Hebrew embedding sample: [${hebrewEmb.slice(0, 3).map(n => n.toFixed(4)).join(', ')}...]`);
    }
    
    if (tx.english_embedding) {
      const englishEmb = JSON.parse(tx.english_embedding);
      console.log(`   English embedding dimensions: ${englishEmb.length}`);
      console.log(`   English embedding sample: [${englishEmb.slice(0, 3).map(n => n.toFixed(4)).join(', ')}...]`);
    }
  });
  
  // Test search functionality
  console.log('\n🔍 Testing search by category...');
  const searchByCategory = db.prepare(`
    SELECT * FROM transactions 
    WHERE category = ? 
    ORDER BY created_at DESC
  `);
  
  const clothingTransactions = searchByCategory.all('clothing_shoes');
  console.log(`Found ${clothingTransactions.length} clothing transactions`);
  
  // Test search by transaction type
  console.log('\n🔍 Testing search by transaction type...');
  const searchByType = db.prepare(`
    SELECT * FROM transactions 
    WHERE transaction_type = ? 
    ORDER BY created_at DESC
  `);
  
  const regularTransactions = searchByType.all('regular');
  console.log(`Found ${regularTransactions.length} regular transactions`);
  
  db.close();
  
  console.log('\n🎉 Full transaction flow test completed successfully!');
  console.log('📁 Database file: ' + dbPath);
  console.log('💡 You can now open this SQLite file in any database admin tool!');
  
  return {
    totalTransactions: allTransactions.length,
    lastTransaction: allTransactions[0],
    dbPath: dbPath
  };
}

// Run the test
testFullTransactionFlow().then((result) => {
  console.log('\n✨ Test Results Summary:');
  console.log('- Total transactions in DB:', result.totalTransactions);
  console.log('- Database location:', result.dbPath);
  console.log('- Last transaction ID:', result.lastTransaction.id);
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 