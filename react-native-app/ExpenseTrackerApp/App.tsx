import React, { useState } from 'react';
import { StyleSheet, View, I18nManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import BottomNavigation from './src/components/BottomNavigation';

// Enable RTL layout for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'transactions':
        return <TransactionsScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <BottomNavigation 
        activeTab={activeTab} 
        onTabPress={setActiveTab} 
      />
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
});
