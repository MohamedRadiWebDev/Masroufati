import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Transaction, Category } from '../types/schema';
import { StorageManager } from '../utils/storage';
import { Colors } from '../styles/colors';

const { width } = Dimensions.get('window');

interface CategoryAnalytics {
  category: string;
  categoryAr: string;
  amount: number;
  color: string;
  icon: string;
  percentage: number;
}

interface PieChartProps {
  data: CategoryAnalytics[];
  size: number;
}

function PieChart({ data, size }: PieChartProps) {
  const radius = size / 2 - 10;
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  let currentAngle = 0;

  return (
    <View style={[styles.chartContainer, { width: size, height: size }]}>
      <View style={styles.pieChart}>
        {data.map((item, index) => {
          const angle = (item.amount / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          
          return (
            <View
              key={index}
              style={[
                styles.pieSlice,
                {
                  backgroundColor: item.color,
                  width: radius,
                  height: 4,
                  position: 'absolute',
                  top: size / 2,
                  left: size / 2,
                  transform: [
                    { translateX: -radius / 2 },
                    { rotate: `${startAngle}deg` },
                  ],
                }
              ]}
            />
          );
        })}
      </View>
      <View style={styles.chartCenter}>
        <Text style={styles.chartCenterText}>إجمالي</Text>
        <Text style={styles.chartCenterAmount}>{total.toFixed(0)} ر.س</Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenseAnalytics, setExpenseAnalytics] = useState<CategoryAnalytics[]>([]);
  const [incomeAnalytics, setIncomeAnalytics] = useState<CategoryAnalytics[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedTransactions = await StorageManager.getTransactions();
    const loadedCategories = await StorageManager.getCategories();
    setTransactions(loadedTransactions);
    setCategories(loadedCategories);
    calculateAnalytics(loadedTransactions, loadedCategories);
  };

  const calculateAnalytics = (txns: Transaction[], cats: Category[]) => {
    // Calculate expense analytics
    const expenseTransactions = txns.filter(t => t.type === 'expense');
    const expenseCategories = cats.filter(c => c.type === 'expense');
    
    const expenseData = expenseCategories.map(category => {
      const categoryTransactions = expenseTransactions.filter(t => t.category === category.id);
      const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        category: category.name,
        categoryAr: category.nameAr,
        amount,
        color: category.color,
        icon: category.icon,
        percentage: 0, // Will calculate after
      };
    }).filter(item => item.amount > 0);

    const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);
    expenseData.forEach(item => {
      item.percentage = totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0;
    });

    // Calculate income analytics
    const incomeTransactions = txns.filter(t => t.type === 'income');
    const incomeCategories = cats.filter(c => c.type === 'income');
    
    const incomeData = incomeCategories.map(category => {
      const categoryTransactions = incomeTransactions.filter(t => t.category === category.id);
      const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        category: category.name,
        categoryAr: category.nameAr,
        amount,
        color: category.color,
        icon: category.icon,
        percentage: 0,
      };
    }).filter(item => item.amount > 0);

    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
    incomeData.forEach(item => {
      item.percentage = totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0;
    });

    setExpenseAnalytics(expenseData.sort((a, b) => b.amount - a.amount));
    setIncomeAnalytics(incomeData.sort((a, b) => b.amount - a.amount));
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>التحليلات والتقارير</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { borderRightColor: Colors.income }]}>
            <Text style={styles.summaryLabel}>إجمالي الدخل</Text>
            <Text style={[styles.summaryAmount, { color: Colors.income }]}>
              {totalIncome.toFixed(2)} ر.س
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { borderRightColor: Colors.expense }]}>
            <Text style={styles.summaryLabel}>إجمالي المصروفات</Text>
            <Text style={[styles.summaryAmount, { color: Colors.expense }]}>
              {totalExpense.toFixed(2)} ر.س
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { borderRightColor: balance >= 0 ? Colors.income : Colors.expense }]}>
            <Text style={styles.summaryLabel}>الرصيد</Text>
            <Text style={[styles.summaryAmount, { color: balance >= 0 ? Colors.income : Colors.expense }]}>
              {balance.toFixed(2)} ر.س
            </Text>
          </View>
        </View>

        {/* Expense Analytics */}
        {expenseAnalytics.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>توزيع المصروفات</Text>
            <View style={styles.chartCard}>
              <PieChart data={expenseAnalytics} size={200} />
              <View style={styles.legend}>
                {expenseAnalytics.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendIcon}>{item.icon}</Text>
                    <View style={styles.legendText}>
                      <Text style={styles.legendLabel}>{item.categoryAr}</Text>
                      <Text style={styles.legendAmount}>
                        {item.amount.toFixed(2)} ر.س ({item.percentage.toFixed(1)}%)
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Income Analytics */}
        {incomeAnalytics.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>توزيع الدخل</Text>
            <View style={styles.chartCard}>
              <PieChart data={incomeAnalytics} size={200} />
              <View style={styles.legend}>
                {incomeAnalytics.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendIcon}>{item.icon}</Text>
                    <View style={styles.legendText}>
                      <Text style={styles.legendLabel}>{item.categoryAr}</Text>
                      <Text style={styles.legendAmount}>
                        {item.amount.toFixed(2)} ر.س ({item.percentage.toFixed(1)}%)
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Empty State */}
        {expenseAnalytics.length === 0 && incomeAnalytics.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateTitle}>لا توجد بيانات للتحليل</Text>
            <Text style={styles.emptyStateMessage}>
              قم بإضافة بعض المعاملات لمشاهدة التحليلات والمخططات
            </Text>
          </View>
        )}
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
  summaryContainer: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderRightWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text.primary,
  },
  chartCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pieChart: {
    position: 'relative',
  },
  pieSlice: {
    borderRadius: 2,
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 40,
    width: 80,
    height: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartCenterText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  chartCenterAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  legend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  legendIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  legendAmount: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    margin: 20,
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