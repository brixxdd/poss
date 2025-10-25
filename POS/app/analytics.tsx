import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MetricsDashboard from '../components/MetricsDashboard';
import TopProductsList from '../components/TopProductsList';

export default function AnalyticsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Análisis Profundo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <MetricsDashboard />
        <TopProductsList />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: (StatusBar.currentHeight || 40) + 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: { padding: 5 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollViewContent: {
    paddingTop: 10,
    paddingBottom: 40,
  },
});
