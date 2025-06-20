import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const creditCardDataExtractorTool = createTool({
  id: 'extract-credit-card-data',
  description: 'Extract general data from credit card or bank account statement CSV text in Hebrew',
  inputSchema: z.object({
    csvText: z.string().describe('CSV text content of the statement in Hebrew'),
  }),
  outputSchema: z.object({
    lastFourDigits: z.string().describe('Last 4 digits of credit card'),
    bankAccountNumber: z.string().describe('Bank account number'),
    statementDate: z.string().describe('Statement date in Hebrew format'),
    totalAmount: z.number().describe('Total amount in NIS'),
  }),
  execute: async ({ context }) => {
    return await extractCreditCardData(context.csvText);
  },
});

const extractCreditCardData = async (csvText: string) => {
  // Hebrew date patterns and common Hebrew banking terms
  const hebrewMonths = {
    'ינואר': '01', 'פברואר': '02', 'מרץ': '03', 'אפריל': '04',
    'מאי': '05', 'יוני': '06', 'יולי': '07', 'אוגוסט': '08',
    'ספטמבר': '09', 'אוקטובר': '10', 'נובמבר': '11', 'דצמבר': '12'
  };

  // Extract last 4 digits of credit card (look for patterns like ****1234)
  const ccPattern = /\*+(\d{4})/g;
  const ccMatch = csvText.match(ccPattern);
  const lastFourDigits = ccMatch ? ccMatch[0].slice(-4) : '';

  // Extract bank account number (look for account number patterns)
  const accountPattern = /(?:חשבון|מספר חשבון|ח\.ב)[:\s]*(\d{6,})/gi;
  const accountMatch = csvText.match(accountPattern);
  const bankAccountNumber = accountMatch ? accountMatch[0].replace(/[^\d]/g, '') : '';

  // Extract statement date (Hebrew format)
  const datePattern = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g;
  const dateMatch = csvText.match(datePattern);
  const statementDate = dateMatch ? dateMatch[0] : '';

  // Extract total amount (look for total/sum patterns with Hebrew currency)
  const totalPattern = /(?:סך הכל|סה״כ|יתרה|סכום)[:\s]*([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:₪|שח״י)?/gi;
  const totalMatch = csvText.match(totalPattern);
  let totalAmount = 0;
  if (totalMatch) {
    const amountStr = totalMatch[0].replace(/[^\d.,-]/g, '');
    totalAmount = parseFloat(amountStr.replace(',', '')) || 0;
  }

  return {
    lastFourDigits,
    bankAccountNumber,
    statementDate,
    totalAmount,
  };
}; 