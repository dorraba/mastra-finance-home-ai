import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { TransactionAnalysis, TransactionAnalysisSchema } from './types';

export const transactionAnalyzerTool = createTool({
  id: 'analyze-transaction',
  description: 'Analyze Hebrew banking transactions to extract embedding-optimized summaries, classify transaction types, and categorize based on Israeli merchant patterns for comprehensive financial tracking',
  inputSchema: z.object({
    transactionText: z.string()
      .min(5, 'Transaction text must contain meaningful content')
      .describe('Single Hebrew transaction text from bank statement including merchant name, amount, date, and transaction details for comprehensive analysis'),
  }),
  outputSchema: TransactionAnalysisSchema,
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

const analyzeTransaction = async (transactionText: string): Promise<TransactionAnalysis> => {
  const result = await generateObject({
    model: openai(process.env.MODEL ?? "gpt-4o"),
    prompt: `
      You are an expert Hebrew banking transaction analyzer specializing in Israeli financial data processing and categorization. Analyze this Hebrew transaction text with precision:

      Hebrew Transaction Text:
      "${transactionText}"

      COMPREHENSIVE ANALYSIS REQUIREMENTS:

      1. **SUMMARY CREATION** (Hebrew, embedding-optimized for search and financial tracking):
         - Create a concise Hebrew summary (70-200 characters)
         - Include: merchant name, transaction amount, purchase type
         - Optimize for vector embedding and semantic search capabilities
         - Example: "רכישה ברמי לוי סופרמרקט 450 ₪ מוצרי מזון"

      2. **TRANSACTION TYPE CLASSIFICATION** (Payment pattern analysis):
         Choose exactly one of these values based on transaction frequency and nature:
         - "regular": Standard one-time transactions, purchases, single payments, ad-hoc expenses
         - "monthly": Recurring payments (look for: קביעות, מנוי, ביטוח, משכנתא, הלוואה, subscriptions)
         - "credit": Income/deposits (look for: זיכוי, החזר, משכורת, קצבה, positive amounts, refunds)

      3. **CATEGORY CLASSIFICATION** (Israeli Banking Context with Merchant Recognition):
         Choose exactly one of these English values based on merchant type and transaction nature:

         - "food_beverage": General food and beverage purchases including cafes, bars, and food courts
         - "transportation": Public transport, taxis, trains, parking fees, and mobility services  
         - "shopping_entertainment": General shopping, entertainment venues, movies, and recreational purchases
         - "fuel": Gas stations and fuel purchases (Sonol, Paz, Dor Alon, Delek)
         - "healthcare": Medical expenses, pharmacies, health funds (Clalit, Maccabi, Leumit, Meuhedet)
         - "education": Schools, courses, educational materials, and learning-related expenses
         - "insurance": Insurance premium payments for health, car, home, or life insurance
         - "mandatory_payments": Taxes, utilities, government fees, and other required payments
         - "restaurants": Dining out, food delivery services, and restaurant meals
         - "grocery": Supermarket purchases (Rami Levy, Shufersal, Victory, Mega, Yochananof)
         - "clothing_shoes": Fashion, clothing, footwear purchases, and apparel shopping
         - "technology": Electronics, software, apps, tech services (Apple, Google, Netflix)
         - "home_design": Furniture, home improvement, interior design, and household items (IKEA)
         - "sports_recreation": Sports equipment, gym memberships, recreational activities, and fitness
         - "banking_finance": Bank fees, loan payments, financial services, and banking charges
         - "other": Miscellaneous transactions that do not fit into other predefined categories

      CRITICAL INSTRUCTIONS: 
      - Return exactly the specified enum values from the schema
      - Analyze Hebrew content but respond with English enum values
      - Consider Israeli merchant patterns and Hebrew banking terminology
      - Prioritize accuracy in categorization for personal finance management
    `,
    schema: TransactionAnalysisSchema,
  });

  return result.object;
}; 