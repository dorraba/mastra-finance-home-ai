import { transactionAnalyzerTool } from './src/mastra/tools/account-statement/transaction-analyzer.ts';

async function testSQLiteDatabase() {
  console.log('🧪 Testing SQLite Database Integration...');
  
  try {
    // Test transaction data (Hebrew)
    const testTransaction = "27/8/24 אורבניקה ₪ 35.00 ₪ 35.00 רגילה אופנה";
    
    console.log('📝 Analyzing transaction:', testTransaction);
    
    // Execute the transaction analyzer tool
    const result = await transactionAnalyzerTool.execute({
      context: {
        transactionText: testTransaction,
        storeInVector: true,
        vectorDB: null // Will use SQLite
      }
    });
    
    console.log('✅ Transaction analysis result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Test another transaction
    const testTransaction2 = "עירית נתניה הוראת קבע 942.55";
    
    console.log('\n📝 Analyzing second transaction:', testTransaction2);
    
    const result2 = await transactionAnalyzerTool.execute({
      context: {
        transactionText: testTransaction2,
        storeInVector: true,
        vectorDB: null
      }
    });
    
    console.log('✅ Second transaction analysis result:');
    console.log(JSON.stringify(result2, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing SQLite database:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testSQLiteDatabase().then(() => {
  console.log('\n🎉 SQLite test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 