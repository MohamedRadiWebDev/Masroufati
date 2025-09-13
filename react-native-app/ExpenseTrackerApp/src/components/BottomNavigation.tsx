import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../styles/colors';

interface Tab {
  key: string;
  label: string;
  icon: string;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

const tabs: Tab[] = [
  { key: 'home', label: 'الرئيسية', icon: '🏠' },
  { key: 'transactions', label: 'المعاملات', icon: '📋' },
  { key: 'analytics', label: 'التحليلات', icon: '📊' },
];

export default function BottomNavigation({ activeTab, onTabPress }: BottomNavigationProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => onTabPress(tab.key)}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === tab.key && styles.activeTabIcon,
              ]}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTab: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: '600',
  },
});