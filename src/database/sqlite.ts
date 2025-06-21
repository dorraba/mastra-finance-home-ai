import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

// Create database directory if it doesn't exist
const dataDir = join(process.cwd(), 'data');
console.log(`📁 Database directory: ${dataDir}`);

if (!existsSync(dataDir)) {
  console.log(`📁 Creating data directory: ${dataDir}`);
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'finance.db');
console.log(`📄 Database file: ${dbPath}`);

// Initialize SQLite database
export const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables for transaction analysis
export const initDatabase = () => {
  // Create transactions table
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

  // Create vector embeddings table (for storing the actual embeddings)
  db.exec(`
    CREATE TABLE IF NOT EXISTS transaction_embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT NOT NULL,
      embedding_type TEXT NOT NULL, -- 'hebrew' or 'english'
      embedding_vector TEXT NOT NULL, -- JSON string of the vector
      FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (transaction_type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category);
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at);
    CREATE INDEX IF NOT EXISTS idx_embeddings_transaction_id ON transaction_embeddings (transaction_id);
  `);
};

// Helper functions for database operations
export const insertTransaction = (data: {
  id: string;
  originalText: string;
  hebrewSummary: string;
  englishSummary: string;
  transactionType: string;
  category: string;
  amount: number;
  hebrewEmbedding: number[];
  englishEmbedding: number[];
}) => {
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

  // Use transaction for atomicity
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

export const getAllTransactions = () => {
  const stmt = db.prepare(`
    SELECT 
      t.*,
      he.embedding_vector as hebrew_embedding,
      ee.embedding_vector as english_embedding
    FROM transactions t
    LEFT JOIN transaction_embeddings he ON t.id = he.transaction_id AND he.embedding_type = 'hebrew'
    LEFT JOIN transaction_embeddings ee ON t.id = ee.transaction_id AND ee.embedding_type = 'english'
    ORDER BY t.created_at DESC
  `);
  
  return stmt.all();
};

export const getTransactionById = (id: string) => {
  const stmt = db.prepare(`
    SELECT 
      t.*,
      he.embedding_vector as hebrew_embedding,
      ee.embedding_vector as english_embedding
    FROM transactions t
    LEFT JOIN transaction_embeddings he ON t.id = he.transaction_id AND he.embedding_type = 'hebrew'
    LEFT JOIN transaction_embeddings ee ON t.id = ee.transaction_id AND ee.embedding_type = 'english'
    WHERE t.id = ?
  `);
  
  return stmt.get(id);
};

export const searchTransactionsByCategory = (category: string) => {
  const stmt = db.prepare(`
    SELECT * FROM transactions 
    WHERE category = ? 
    ORDER BY created_at DESC
  `);
  
  return stmt.all(category);
};

// Initialize database on import
initDatabase(); 