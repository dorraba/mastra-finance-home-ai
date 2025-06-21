const { transactionAnalyzerTool } = require('./dist/src/mastra/tools/account-statement/transaction-analyzer.js');

async function testMastraWithSQLite() {
  console.log('🧪 Testing Mastra Transaction Analyzer with SQLite...');
  
  try {
    // Test Hebrew transaction
    const testTransaction1 = "27/8/24 אורבניקה ₪ 35.00 ₪ 35.00 רגילה אופנה";
    
    console.log('📝 Analyzing transaction 1:', testTransaction1);
    
    const result1 = await transactionAnalyzerTool.execute({
      context: {
        transactionText: testTransaction1,
        storeInVector: true,
        vectorDB: null // Will use SQLite based on env variable
      }
    });
    
    console.log('✅ Transaction 1 analysis result:');
    console.log('Hebrew Summary:', result1.summary);
    console.log('English Summary:', result1.englishSummary);
    console.log('Type:', result1.transactionType);
    console.log('Category:', result1.category);
    console.log('Vector ID:', result1.vectorId);
    console.log('Mutation ID:', result1.mutationId);
    console.log('Hebrew Embedding Length:', result1.summaryEmbedding.length);
    console.log('English Embedding Length:', result1.englishSummaryEmbedding.length);
    
    // Test another transaction
    const testTransaction2 = "עירית נתניה הוראת קבע 942.55";
    
    console.log('\n📝 Analyzing transaction 2:', testTransaction2);
    
    const result2 = await transactionAnalyzerTool.execute({
      context: {
        transactionText: testTransaction2,
        storeInVector: true,
        vectorDB: null
      }
    });
    
    console.log('✅ Transaction 2 analysis result:');
    console.log('Hebrew Summary:', result2.summary);
    console.log('English Summary:', result2.englishSummary);
    console.log('Type:', result2.transactionType);
    console.log('Category:', result2.category);
    console.log('Vector ID:', result2.vectorId);
    console.log('Mutation ID:', result2.mutationId);
    
  } catch (error) {
    console.error('❌ Error testing Mastra with SQLite:', error);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testMastraWithSQLite().then(() => {
  console.log('\n🎉 Mastra SQLite test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 