import { z } from 'zod';

/**
 * Transaction type schema with detailed descriptions for each value
 */
export const TransactionTypeSchema = z.union([
  z.literal('regular').describe('Standard one-time transaction: purchases, single payments, ad-hoc expenses'),
  z.literal('monthly').describe('Recurring monthly payment: subscriptions, insurance premiums, mortgage payments, utility bills'),
  z.literal('credit').describe('Income or money coming into account: salary deposits, refunds, transfers received')
]).describe('Transaction classification based on payment pattern and source');

/**
 * Transaction category schema with comprehensive Israeli banking context
 */
export const TransactionCategorySchema = z.union([
  z.literal('food_beverage').describe('General food and beverage purchases including cafes, bars, and food courts'),
  z.literal('transportation').describe('Public transport, taxis, trains, parking fees, and mobility services'),
  z.literal('shopping_entertainment').describe('General shopping, entertainment venues, movies, and recreational purchases'),
  z.literal('fuel').describe('Gas stations and fuel purchases (Sonol, Paz, Dor Alon, Delek)'),
  z.literal('healthcare').describe('Medical expenses, pharmacies, health funds (Clalit, Maccabi, Leumit, Meuhedet)'),
  z.literal('education').describe('Schools, courses, educational materials, and learning-related expenses'),
  z.literal('insurance').describe('Insurance premium payments for health, car, home, or life insurance'),
  z.literal('mandatory_payments').describe('Taxes, utilities, government fees, and other required payments'),
  z.literal('restaurants').describe('Dining out, food delivery services, and restaurant meals'),
  z.literal('grocery').describe('Supermarket purchases (Rami Levy, Shufersal, Victory, Mega, Yochananof)'),
  z.literal('clothing_shoes').describe('Fashion, clothing, footwear purchases, and apparel shopping'),
  z.literal('technology').describe('Electronics, software, apps, tech services (Apple, Google, Netflix)'),
  z.literal('home_design').describe('Furniture, home improvement, interior design, and household items (IKEA)'),
  z.literal('sports_recreation').describe('Sports equipment, gym memberships, recreational activities, and fitness'),
  z.literal('banking_finance').describe('Bank fees, loan payments, financial services, and banking charges'),
  z.literal('other').describe('Miscellaneous transactions that do not fit into other predefined categories')
]).describe('Comprehensive categorization system for Israeli banking transactions based on merchant type and purchase nature');

/**
 * Credit card data extraction schema with comprehensive validation
 */
export const CreditCardDataSchema = z.object({
  lastFourDigits: z.string()
    .length(4, 'Must be exactly 4 digits')
    .regex(/^\d{4}$/, 'Must contain only digits')
    .describe('Last 4 digits of the credit card number for identification purposes, extracted from Hebrew patterns like "המסתיים ב-4357"'),
    
  bankAccountNumber: z.string()
    .min(6, 'Bank account number must be at least 6 digits')
    .max(12, 'Bank account number cannot exceed 12 digits')
    .regex(/^\d+$/, 'Must contain only digits, no hyphens or spaces')
    .describe('Bank account number in digits only format, extracted from Hebrew banking statements like "לחשבון מזרחי-טפחות 577-181036"'),
    
  statementDate: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Must be in DD/MM/YYYY format')
    .describe('Statement date in Israeli format (DD/MM/YYYY) as it appears in Hebrew banking documents'),
    
  totalAmount: z.number()
    .positive('Total amount must be positive')
    .multipleOf(0.01, 'Amount must be in valid currency format with max 2 decimal places')
    .describe('Total amount in Israeli New Shekel (₪), extracted from Hebrew banking statements with proper decimal formatting')
}).describe('Complete credit card statement data extracted from Hebrew banking documents including card identification, account details, and financial totals');

/**
 * Transaction analysis schema with Hebrew embedding optimization
 */
export const TransactionAnalysisSchema = z.object({
  summary: z.string()
    .min(70, 'Summary must be at least 70 characters for meaningful and detailed content')
    .max(200, 'Summary should be concise, maximum 200 characters')
    .describe('Clean Hebrew transaction summary for embedding: merchant name + amount + transaction type. Human readable, amount appears once, no special characters or tabs. Example: "תשלום חודשי עירית נתניה 942.55 ₪"'),
    
  englishSummary: z.string()
    .min(70, 'English summary must be at least 70 characters for meaningful and detailed content')
    .max(200, 'English summary should be concise, maximum 200 characters')
    .describe('Clean English transaction summary for embedding: merchant name + amount + transaction type. Human readable, amount appears once, no special characters or tabs. Example: "Monthly payment to Netanya Municipality 942.55 NIS"'),
    
  summaryEmbedding: z.array(z.number())
    .length(1536, 'OpenAI text-embedding-ada-002 produces 1536-dimensional vectors')
    .describe('Vector embedding of the Hebrew summary for semantic search and similarity matching in financial applications'),
    
  englishSummaryEmbedding: z.array(z.number())
    .length(1536, 'OpenAI text-embedding-ada-002 produces 1536-dimensional vectors')
    .describe('Vector embedding of the English summary for semantic search and similarity matching in financial applications'),
    
  transactionType: TransactionTypeSchema
    .describe('Classification of transaction frequency: regular (one-time purchase), monthly (recurring subscription/insurance), or credit (incoming money/salary)'),
    
  category: TransactionCategorySchema
    .describe('Transaction category based on Israeli merchant patterns and transaction nature for personal finance tracking and budgeting')
}).describe('Complete analysis of a Hebrew banking transaction including intelligent categorization, embedding-ready summaries in both Hebrew and English, and their corresponding vector embeddings for financial management and semantic search');

// Inferred TypeScript types from Zod schemas
export type CreditCardData = z.infer<typeof CreditCardDataSchema>;
export type TransactionAnalysis = z.infer<typeof TransactionAnalysisSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>; 