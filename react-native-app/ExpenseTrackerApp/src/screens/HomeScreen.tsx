import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Transaction, TransactionType, Category } from '../types/schema';
import { StorageManager } from '../utils/storage';
import { Colors } from '../styles/colors';

interface BalanceCardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

function BalanceCard({ totalIncome, totalExpense, balance }: BalanceCardProps) {
  return (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceTitle}>الرصيد الحالي</Text>
      <Text style={[styles.balanceAmount, { color: balance >= 0 ? Colors.income : Colors.expense }]}>
        {balance.toFixed(2)} ر.س
      </Text>
      <View style={styles.balanceDetails}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>الدخل</Text>
          <Text style={[styles.balanceValue, { color: Colors.income }]}>
            {totalIncome.toFixed(2)} ر.س
          </Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>المصروفات</Text>
          <Text style={[styles.balanceValue, { color: Colors.expense }]}>
            {totalExpense.toFixed(2)} ر.س
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedTransactions = await StorageManager.getTransactions();
    const loadedCategories = await StorageManager.getCategories();
    setTransactions(loadedTransactions);
    setCategories(loadedCategories);
  };

  const calculateTotals = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  };

  const addTransaction = async () => {
    if (!amount || !selectedCategory) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات المطلوبة');
      return;
    }

    const newTransaction: Transaction = {
      id: StorageManager.generateId(),
      amount: parseFloat(amount),
      category: selectedCategory,
      note: note || undefined,
      type: transactionType,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await StorageManager.saveTransaction(newTransaction);
    setTransactions([...transactions, newTransaction]);
    
    // Reset form
    setAmount('');
    setNote('');
    setSelectedCategory('');
    setIsAddingTransaction(false);
  };

  const { totalIncome, totalExpense, balance } = calculateTotals();
  const filteredCategories = categories.filter(c => c.type === transactionType);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>إدارة المصاريف</Text>
        </View>

        <BalanceCard 
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
        />

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: Colors.income }]}
            onPress={() => {
              setTransactionType('income');
              setIsAddingTransaction(true);
            }}
          >
            <Text style={styles.actionButtonText}>+ دخل</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: Colors.expense }]}
            onPress={() => {
              setTransactionType('expense');
              setIsAddingTransaction(true);
            }}
          >
            <Text style={styles.actionButtonText}>- مصروف</Text>
          </TouchableOpacity>
        </View>

        {isAddingTransaction && (
          <View style={styles.addTransactionForm}>
            <Text style={styles.formTitle}>
              إضافة {transactionType === 'income' ? 'دخل' : 'مصروف'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="المبلغ"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="ملاحظة (اختياري)"
              value={note}
              onChangeText={setNote}
            />

            <ScrollView horizontal style={styles.categorySelector}>
              {filteredCategories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.selectedCategory
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.nameAr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={addTransaction}>
                <Text style={styles.saveButtonText}>حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setIsAddingTransaction(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.recentTransactions}>
          <Text style={styles.sectionTitle}>المعاملات الأخيرة</Text>
          {transactions.slice(-5).reverse().map(transaction => {
            const category = categories.find(c => c.id === transaction.category);
            return (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionIcon}>{category?.icon || '💰'}</Text>
                  <View>
                    <Text style={styles.transactionCategory}>{category?.nameAr}</Text>
                    {transaction.note && (
                      <Text style={styles.transactionNote}>{transaction.note}</Text>
                    )}
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'income' ? Colors.income : Colors.expense }
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)} ر.س
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  balanceCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceTitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 0.45,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addTransactionForm: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'right',
  },
  categorySelector: {
    marginBottom: 16,
  },
  categoryItem: {
    alignItems: 'center',
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
  },
  selectedCategory: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 0.45,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 0.45,
    backgroundColor: Colors.gray[200],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  recentTransactions: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionNote: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});