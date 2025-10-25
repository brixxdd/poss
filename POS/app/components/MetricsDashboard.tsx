import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';

interface Metric {
  product_name: string;
  model_version: string;
  mae: number;
  rmse: number;
  evaluated_at: string;
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/analytics/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetrics(response.data);
    } catch (err: any) {
      console.error('Error fetching metrics:', err.response?.data || err.message);
      setError('No se pudieron cargar las métricas del modelo.');
      Alert.alert('Error', 'No se pudieron cargar las métricas del modelo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.loadingText}>Cargando Métricas del Modelo...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="warning-outline" size={30} color="#ff5858" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (metrics.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="information-circle-outline" size={30} color="rgba(255,255,255,0.7)" />
        <Text style={styles.noDataText}>Aún no hay métricas de modelo disponibles.</Text>
      </View>
    );
  }

  const renderMetricItem = ({ item }: { item: Metric }) => (
    <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
            <Ionicons name="analytics-outline" size={20} color="#fff" />
            <Text style={styles.itemName}>{item.product_name}</Text>
        </View>
        <Text style={styles.itemModel}>Modelo: {item.model_version}</Text>
        <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>MAE</Text>
                <Text style={styles.metricValue}>{item.mae.toFixed(2)}</Text>
            </View>
            <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>RMSE</Text>
                <Text style={styles.metricValue}>{item.rmse.toFixed(2)}</Text>
            </View>
        </View>
        <Text style={styles.itemDate}>Evaluado el: {new Date(item.evaluated_at).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Métricas de Rendimiento del Modelo</Text>
      <FlatList
        data={metrics}
        renderItem={renderMetricItem}
        keyExtractor={(item, index) => `${item.product_name}-${item.model_version}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    color: '#ff5858',
    marginTop: 10,
    textAlign: 'center',
  },
  noDataText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  itemContainer: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 15,
    padding: 15,
    width: 280, // Fixed width for horizontal items
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  itemModel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  metricBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  metricLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 5,
  },
});
