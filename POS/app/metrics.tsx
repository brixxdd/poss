import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from './constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface Metric {
  id: number;
  model_version: string;
  product_name: string;
  horizon: number;
  mae: number;
  rmse: number;
  evaluated_at: string;
}

export default function MetricsScreen() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/analytics/model-metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetrics(response.data);
    } catch (error: any) {
      console.error('Error fetching model metrics:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]));

  const renderMetricItem = ({ item }: { item: Metric }) => (
    <BlurView intensity={40} tint="light" style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Ionicons name="stats-chart-outline" size={24} color="#fff" />
        <Text style={styles.itemModelVersion}>{item.model_version}</Text>
      </View>
      <Text style={styles.itemProductName}>{item.product_name}</Text>
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>MAE</Text>
          <Text style={styles.metricValue}>{item.mae.toFixed(2)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>RMSE</Text>
          <Text style={styles.metricValue}>{item.rmse.toFixed(2)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Horizon</Text>
          <Text style={styles.metricValue}>{item.horizon} days</Text>
        </View>
      </View>
      <Text style={styles.itemDate}>Evaluated on: {new Date(item.evaluated_at).toLocaleString()}</Text>
    </BlurView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000428', '#004e92']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Model Performance</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#fff" /></View>
      ) : metrics.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="information-circle-outline" size={60} color="rgba(255,255,255,0.7)" />
          <Text style={styles.emptyText}>No model metrics available.</Text>
          <Text style={styles.emptySubText}>Run predictions and evaluations to see metrics here.</Text>
        </View>
      ) : (
        <FlatList
          data={metrics}
          renderItem={renderMetricItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: { padding: 5 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    marginBottom: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemModelVersion: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  itemProductName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 15,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  metricBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
});
