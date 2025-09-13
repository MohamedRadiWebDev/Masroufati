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
import { Transaction, Category } from '../types/schema';
import { StorageManager } from '../utils/storage';
import { Colors } from '../styles/colors';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, filterType]);

  const loadData = async () => {
    const loadedTransactions = await StorageManager.getTransactions();
    const loadedCategories = await StorageManager.getCategories();
    setTransactions(loadedTransactions);
    setCategories(loadedCategories);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t => {
        const category = categories.find(c => c.id === t.category);
        return (
          category?.nameAr.includes(searchQuery) ||
          category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.note?.includes(searchQuery)
        );
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(filtered);
  };

  const deleteTransaction = async (id: string) => {
    Alert.alert(
      'حذف المعاملة',
      'هل أنت متأكد من حذف هذه المعاملة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await StorageManager.deleteTransaction(id);
            const updatedTransactions = transactions.filter(t => t.id !== id);
            setTransactions(updatedTransactions);
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>جميع المعاملات</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.controlsContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="البحث في المعاملات..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.activeFilter]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>
              الكل
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'income' && styles.activeFilter]}
            onPress={() => setFilterType('income')}
          >
            <Text style={[styles.filterText, filterType === 'income' && styles.activeFilterText]}>
              دخل
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'expense' && styles.activeFilter]}
            onPress={() => setFilterType('expense')}
          >
            <Text style={[styles.filterText, filterType === 'expense' && styles.activeFilterText]}>
              مصروف
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📝</Text>
            <Text style={styles.emptyStateTitle}>لا توجد معاملات</Text>
            <Text style={styles.emptyStateMessage}>
              {searchQuery || filterType !== 'all' 
                ? 'لم يتم العثور على معاملات تطابق البحث أو الفلتر'
                : 'قم بإضافة أول معاملة لك لتظهر هنا'
              }
            </Text>
          </View>
        ) : (
          filteredTransactions.map(transaction => {
            const category = categories.find(c => c.id === transaction.category);
            return (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onLongPress={() => deleteTransaction(transaction.id)}
              >
                <View style={styles.transactionLeft}>
                  <View style={[styles.categoryIconContainer, { backgroundColor: category?.color + '20' }]}>
                    <Text style={styles.categoryIcon}>{category?.icon || '💰'}</Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.categoryName}>{category?.nameAr}</Text>
                    {transaction.note && (
                      <Text style={styles.transactionNote}>{transaction.note}</Text>
                    )}
                    <View style={styles.transactionMeta}>
                      <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                      <Text style={styles.transactionTime}>{formatTime(transaction.date)}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? Colors.income : Colors.expense }
                  ]}>
                    {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)} ر.س
                  </Text>
                  <View style={[
                    styles.typeIndicator,
                    { backgroundColor: transaction.type === 'income' ? Colors.income : Colors.expense }
                  ]}>
                    <Text style={styles.typeText}>
                      {transaction.type === 'income' ? 'دخل' : 'مصروف'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>الملخص</Text>
          <Text style={styles.summaryText}>
            إجمالي {filteredTransactions.length} معاملة
          </Text>
          {filterType === 'all' && (
            <>
              <Text style={styles.summaryText}>
                الدخل: {filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toFixed(2)} ر.س
              </Text>
              <Text style={styles.summaryText}>
                المصروفات: {filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toFixed(2)} ر.س
              </Text>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  controlsContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  activeFilterText: {
    color: 'white',
  },
  transactionsList: {
    flex: 1,
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
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
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.text.muted,
    marginLeft: 8,
  },
  transactionTime: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  summary: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});