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

// Helper para interpretar MAE y retornar calidad con semáforo
const getMetricQuality = (mae: number) => {
  if (mae < 2) {
    return { emoji: '🟢', label: 'Excelente', color: '#32cd32', description: 'Predicción muy precisa' };
  } else if (mae >= 2 && mae <= 5) {
    return { emoji: '🟡', label: 'Bueno', color: '#ffae42', description: 'Predicción confiable' };
  } else {
    return { emoji: '🔴', label: 'Regular', color: '#ff5858', description: 'Predicción menos precisa' };
  }
};

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

  const renderMetricItem = ({ item }: { item: Metric }) => {
    const quality = getMetricQuality(item.mae);

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <Ionicons name="analytics-outline" size={20} color="#fff" />
          <Text style={styles.itemName}>{item.product_name}</Text>
        </View>

        {/* Semáforo de Calidad */}
        <View style={styles.qualityContainer}>
          <Text style={styles.qualityEmoji}>{quality.emoji}</Text>
          <View style={styles.qualityTextContainer}>
            <Text style={[styles.qualityLabel, { color: quality.color }]}>{quality.label}</Text>
            <Text style={styles.qualityDescription}>{quality.description}</Text>
          </View>
        </View>

        {/* Métricas Técnicas (compactas) */}
        <View style={styles.technicalMetrics}>
          <Text style={styles.modelVersion}>{item.model_version}</Text>
        </View>

        <Text style={styles.itemDate}>Evaluado: {new Date(item.evaluated_at).toLocaleDateString()}</Text>
      </View>
    );
  };

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
    width: 280,
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  qualityEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  qualityTextContainer: {
    flex: 1,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  qualityDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  technicalMetrics: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  technicalText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  modelVersion: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  itemDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
