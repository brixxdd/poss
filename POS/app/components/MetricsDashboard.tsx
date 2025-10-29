import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '../CustomAlert';

interface AggregatedMetric {
  model_version: string;
  avg_mae: number;
  avg_rmse: number;
  products_count: number;
  last_evaluated: string;
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
  const [metrics, setMetrics] = useState<AggregatedMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' as 'info' | 'success' | 'warning' | 'error', buttons: [{ text: 'OK' }] });

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/analytics/aggregated-metrics`, {
        headers: { Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true' },
      });
      setMetrics(response.data);
    } catch (err: any) {
      console.error('Error fetching metrics:', err.response?.data || err.message);
      setError('No se pudieron cargar las métricas del modelo.');
      setAlertData({ title: 'Error', message: 'No se pudieron cargar las métricas del modelo.', type: 'error', buttons: [{ text: 'OK' }] });
      setAlertVisible(true);
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

  const renderMetricItem = ({ item }: { item: AggregatedMetric }) => {
    const quality = getMetricQuality(item.avg_mae);

    return (
      <View style={styles.itemContainer}>
        {/* Indicador de Calidad Principal */}
        <View style={styles.qualityContainer}>
          <Text style={styles.qualityEmoji}>{quality.emoji}</Text>
          <View style={styles.qualityTextContainer}>
            <Text style={[styles.qualityLabel, { color: quality.color }]}>{quality.label}</Text>
            <Text style={styles.qualityDescription}>{quality.description}</Text>
          </View>
        </View>

        {/* Información del Modelo */}
        <View style={styles.modelInfoContainer}>
          <View style={styles.modelRow}>
            <Ionicons name="code-working-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.modelName}>{item.model_version}</Text>
          </View>

          <View style={styles.modelRow}>
            <Ionicons name="cube-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.modelDetail}>
              {item.products_count} {item.products_count === 1 ? 'producto evaluado' : 'productos evaluados'}
            </Text>
          </View>
        </View>

        {/* Fecha de Evaluación */}
        <Text style={styles.itemDate}>
          Última evaluación: {new Date(item.last_evaluated).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Métricas de Rendimiento del Modelo</Text>
      <FlatList
        data={metrics}
        renderItem={renderMetricItem}
        keyExtractor={(item, index) => `${item.model_version}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      
      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        buttons={alertData.buttons}
        onDismiss={() => setAlertVisible(false)}
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
  modelInfoContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    flex: 1,
  },
  modelDetail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  itemDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
