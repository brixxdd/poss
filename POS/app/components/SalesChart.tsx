import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Dimensions, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';

const screenWidth = Dimensions.get('window').width;

// Define the type for our chart data
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string; // Optional color for dataset
    strokeWidth?: number; // Optional strokeWidth for dataset
  }[];
}

export default function SalesChart({ productId }: { productId: string }) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<string | null>(null);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');

      // Fetch historical sales data
      const historyResponse = await axios.get(`${BACKEND_URL}/api/analytics/sales-history/${productId}`, {
        headers: { Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      });
      const historicalSales = historyResponse.data;

      // Fetch sales predictions
      const predictionResponse = await axios.get(`${BACKEND_URL}/api/analytics/sales-prediction/${productId}?horizon=7`, {
        headers: { Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      });
      const predictions = predictionResponse.data.predicted_daily;

      // Detectar qué modelo se usó
      const modelVersion = predictionResponse.data.model_version || 'método clásico';
      if (modelVersion.includes('prophet')) {
        setModelInfo('🤖 Predicción con IA (Prophet)');
      } else {
        setModelInfo('📊 Predicción estadística clásica');
      }

      if (historicalSales.length === 0 && predictions.length === 0) {
        setChartData(null);
        return;
      }

      // Combine labels: historical dates + future dates for predictions
      const historyLabels = historicalSales.map((d: any) => new Date(d.day).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
      const predictionLabels = Array.from({ length: predictions.length }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1); // Start from tomorrow
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      });

      const allLabels = [...historyLabels, ...predictionLabels];

      // Reducir etiquetas para evitar amontonamiento: mostrar solo cada 3 etiquetas
      const displayLabels = allLabels.map((label, index) =>
        index % 3 === 0 ? label : ''
      );

      // Prepare datasets - CORREGIDO: usar 0 en vez de null para evitar problemas de renderizado
      const historicalData = historicalSales.map((d: any) => d.qty);
      const predictionData = predictions;

      // Conectar histórico con predicción: último punto histórico = primer punto de predicción
      const historicalDataset = {
        data: [...historicalData, predictionData[0] || 0],
        color: (opacity = 1) => `rgba(0, 242, 254, ${opacity})`, // Blue for historical
        strokeWidth: 2,
      };

      // Dataset de predicción: rellenar con 0 los puntos históricos
      const predictionDataset = {
        data: [...Array(historicalData.length).fill(0), ...predictionData],
        color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`, // Orange for prediction
        strokeWidth: 2,
        withDots: false, // No mostrar puntos en la zona histórica
      };

      setChartData({
        labels: displayLabels,
        datasets: [historicalDataset, predictionDataset],
      });

    } catch (err: any) {
      console.error('Failed to fetch sales data for chart:', err);
      setError('No se pudieron cargar los datos del gráfico.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchSalesData();
    }
  }, [productId, fetchSalesData]);

  if (loading) {
    return <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 20 }} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!chartData || chartData.datasets.every(ds => ds.data.every(val => val === null))) {
    return <Text style={styles.noDataText}>No hay datos de ventas para mostrar un gráfico.</Text>;
  }

  // Calcular ancho dinámico basado en el número de puntos de datos
  const dataPoints = chartData.labels.length;
  const minWidth = screenWidth - 40;
  const dynamicWidth = Math.max(minWidth, dataPoints * 15); // 15px por punto de datos

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tendencia y Predicción de Ventas</Text>
      {modelInfo && (
        <View style={styles.modelBadge}>
          <Text style={styles.modelText}>{modelInfo}</Text>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <LineChart
          data={chartData}
          width={dynamicWidth}
          height={220}
          yAxisLabel=""
          yAxisSuffix=" u."
          yAxisInterval={1} // Only show integer values
          chartConfig={{
            backgroundColor: '#764ba2',
            backgroundGradientFrom: '#667eea',
            backgroundGradientTo: '#764ba2',
            decimalPlaces: 0, // No decimal places for y-axis labels
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffa726',
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
        paddingBottom: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
    },
    scrollView: {
        width: '100%',
    },
    scrollViewContent: {
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 15,
    },
    modelBadge: {
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 5,
    },
    modelText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    noDataText: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginVertical: 20,
        padding: 10,
    },
    errorText: {
        color: '#ff5858',
        textAlign: 'center',
        marginVertical: 20,
        padding: 10,
        fontWeight: 'bold',
    }
});