const Database = require('better-sqlite3');
const { join } = require('path');

// Create database
const dbPath = join(process.cwd(), 'data', 'finance.db');
console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);

// Enable WAL mode
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    original_text TEXT NOT NULL,
    hebrew_summary TEXT NOT NULL,
    english_summary TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    embedding_model TEXT DEFAULT 'text-embedding-3-small'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS transaction_embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL,
    embedding_type TEXT NOT NULL,
    embedding_vector TEXT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
  )
`);

console.log('✅ Database tables created successfully');

// Test insert
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

// Sample data
const testData = {
  id: 'test_' + Date.now(),
  originalText: '27/8/24 אורבניקה ₪ 35.00 ₪ 35.00 רגילה אופנה',
  hebrewSummary: 'רכישה בחנות אורבניקה בסך 35 שקלים עבור בגדים ואופנה',
  englishSummary: 'Purchase at Urbanica store for 35 NIS for clothing and fashion',
  transactionType: 'regular',
  category: 'clothing_shoes',
  amount: 35.0,
  hebrewEmbedding: new Array(1536).fill(0.1), // Mock embedding
  englishEmbedding: new Array(1536).fill(0.2) // Mock embedding
};

// Insert transaction
const transaction = db.transaction(() => {
  insertTx.run(
    testData.id,
    testData.originalText,
    testData.hebrewSummary,
    testData.englishSummary,
    testData.transactionType,
    testData.category,
    testData.amount
  );

  insertEmbedding.run(
    testData.id,
    'hebrew',
    JSON.stringify(testData.hebrewEmbedding)
  );

  insertEmbedding.run(
    testData.id,
    'english',
    JSON.stringify(testData.englishEmbedding)
  );
});

transaction();

console.log('✅ Test transaction inserted with ID:', testData.id);

// Query all transactions
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

console.log('\n📊 All transactions in database:');
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
  console.log(`   Has Hebrew embedding: ${tx.hebrew_embedding ? 'Yes' : 'No'}`);
  console.log(`   Has English embedding: ${tx.english_embedding ? 'Yes' : 'No'}`);
});

// Close database
db.close();

console.log('\n🎉 Database test completed successfully!');
console.log('📁 Database file location:', dbPath);
console.log('💡 You can now connect to this SQLite file with any database admin tool!'); 