// Simple test to verify Arabic text processing functionality
import { parseArabicTransactionText, suggestCategoryFromText } from './client/src/lib/arabic-text-processor.ts';

// Mock categories for testing
const testCategories = [
  { id: '1', name: 'food', type: 'expense', nameAr: 'طعام' },
  { id: '2', name: 'transport', type: 'expense', nameAr: 'مواصلات' },
  { id: '3', name: 'salary', type: 'income', nameAr: 'راتب' },
  { id: '4', name: 'other', type: 'expense', nameAr: 'أخرى' },
  { id: '5', name: 'other_income', type: 'income', nameAr: 'دخل آخر' }
];

// Test cases
const testCases = [
  {
    input: "اشتريت أكل بعشرين جنيه",
    expected: {
      transactions: [
        {
          type: 'expense',
          amount: 20,
          category: 'food'
        }
      ]
    }
  },
  {
    input: "صرفت خمسة وعشرين جنيه على مواصلات",
    expected: {
      transactions: [
        {
          type: 'expense', 
          amount: 25,
          category: 'transport'
        }
      ]
    }
  },
  {
    input: "استلمت راتب ألف جنيه",
    expected: {
      transactions: [
        {
          type: 'income',
          amount: 1000,
          category: 'salary'
        }
      ]
    }
  }
];

console.log('=== Testing Arabic Text Processing Functionality ===\n');

// Test the main parsing function
testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: "${testCase.input}"`);
  
  try {
    const result = parseArabicTransactionText(testCase.input, testCategories);
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    // Basic validation
    if (result.transactions.length > 0) {
      const transaction = result.transactions[0];
      const expected = testCase.expected.transactions[0];
      
      const typeMatch = transaction.type === expected.type;
      const amountMatch = transaction.amount === expected.amount;
      const categoryMatch = transaction.category === expected.category;
      
      console.log(`✓ Type: ${typeMatch ? 'PASS' : 'FAIL'} (${transaction.type} vs ${expected.type})`);
      console.log(`✓ Amount: ${amountMatch ? 'PASS' : 'FAIL'} (${transaction.amount} vs ${expected.amount})`);
      console.log(`✓ Category: ${categoryMatch ? 'PASS' : 'FAIL'} (${transaction.category} vs ${expected.category})`);
      console.log(`Overall: ${typeMatch && amountMatch && categoryMatch ? '✅ PASS' : '❌ FAIL'}`);
    } else {
      console.log('❌ FAIL: No transactions parsed');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('---\n');
});

// Test category suggestion
console.log('=== Testing Category Suggestion ===\n');

const categorySuggestionTests = [
  { input: "أكل", type: 'expense', expected: 'food' },
  { input: "مواصلات", type: 'expense', expected: 'transport' },
  { input: "راتب", type: 'income', expected: 'salary' }
];

categorySuggestionTests.forEach((test, index) => {
  console.log(`Category Test ${index + 1}: "${test.input}"`);
  
  try {
    const result = suggestCategoryFromText(test.input, testCategories, test.type);
    const isCorrect = result === test.expected;
    
    console.log(`Result: ${result}`);
    console.log(`Expected: ${test.expected}`);
    console.log(`Status: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('---\n');
});

console.log('=== Test Complete ===');