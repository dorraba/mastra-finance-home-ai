import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const transactionAnalyzerTool = createTool({
  id: 'analyze-transaction',
  description: 'Analyze a single transaction from Hebrew bank statement and extract summary, type, and category',
  inputSchema: z.object({
    transactionText: z.string().describe('Single transaction text in Hebrew'),
  }),
  outputSchema: z.object({
    summary: z.string().describe('Transaction summary optimized for embeddings'),
    transactionType: z.enum(['regular', 'monthly', 'credit']).describe('Type of transaction'),
    category: z.string().describe('Transaction category from predefined list'),
  }),
  execute: async ({ context }) => {
    return await analyzeTransaction(context.transactionText);
  },
});

/**
 * Predefined categories for Israeli banking transactions
 */
export const TRANSACTION_CATEGORIES = [
  'מזון ושתייה', // Food & Beverage
  'תחבורה', // Transportation
  'קניות ובילוי', // Shopping & Entertainment
  'דלק', // Fuel
  'רפואה ובריאות', // Healthcare
  'חינוך', // Education
  'ביטוח', // Insurance
  'תשלומי חובה', // Mandatory payments
  'מסעדות', // Restaurants
  'מכולת וסופרמרקט', // Grocery
  'בגדים ונעליים', // Clothing & Shoes
  'טכנולוגיה', // Technology
  'בית ועיצוב', // Home & Design
  'ספורט ופנוי', // Sports & Recreation
  'בנקאות ופיננסים', // Banking & Finance
  'אחר' // Other
] as const;

/**
 * Keywords that indicate monthly recurring transactions
 */
const MONTHLY_KEYWORDS = ['קביעות', 'חודשי', 'מנוי', 'ביטוח', 'משכנתא', 'הלוואה'];

/**
 * Keywords that indicate credit/income transactions
 */
const CREDIT_KEYWORDS = ['זיכוי', 'החזר', 'משכורת', 'קצבה', 'הפקדה'];

/**
 * Merchant patterns for transaction categorization
 */
const MERCHANT_PATTERNS = {
  'מזון ושתייה': /רמי לוי|שופרסל|ויקטורי|מגה|יוחננוף|מחסני השוק|שוק|מזון|מסעדה|קפה|בר/i,
  'דלק': /דלק|גז|תחנת דלק|סונול|פז|דור אלון/i,
  'תחבורה': /מונית|אוטובוס|רכבת|חניה|גט|מובי/i,
  'רפואה ובריאות': /רופא|רפואה|מכבי|כללית|לאומית|מאוחדת|בית מרקחת|קופת חולים/i,
  'קניות ובילוי': /H&M|זארה|אייס|פוקס|קסטרו|גולף|ביג|דייסו|איקאה/i,
  'טכנולוגיה': /אפל|גוגל|מיקרוסופט|אמזון|נטפליקס|ספוטיפיי|KSP|יודיעין/i,
  'בנקאות ופיננסים': /בנק|עמלה|ריבית|הלוואה|ביטוח|משכנתא/i,
};

const analyzeTransaction = async (transactionText: string) => {
  // Determine transaction type
  let transactionType: 'regular' | 'monthly' | 'credit' = 'regular';
  
  if (MONTHLY_KEYWORDS.some(keyword => transactionText.includes(keyword))) {
    transactionType = 'monthly';
  } else if (CREDIT_KEYWORDS.some(keyword => transactionText.includes(keyword)) || 
             transactionText.includes('+') || 
             parseFloat(transactionText.replace(/[^\d.-]/g, '')) > 0) {
    transactionType = 'credit';
  }

  // Categorize transaction based on merchant name and transaction description
  let category: string = 'אחר';
  
  for (const [categoryName, pattern] of Object.entries(MERCHANT_PATTERNS)) {
    if (pattern.test(transactionText)) {
      category = categoryName;
      break;
    }
  }

  // Create embedding-optimized summary
  const cleanText = transactionText.replace(/[^\u0590-\u05FF\s\d.,₪-]/g, '').trim();
  const summary = `עסקה: ${cleanText} סוג: ${transactionType} קטגוריה: ${category}`;

  return {
    summary,
    transactionType,
    category,
  };
}; 