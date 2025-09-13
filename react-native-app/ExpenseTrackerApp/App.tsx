import React from 'react';
import { StyleSheet, View, I18nManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';

// Enable RTL layout for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
