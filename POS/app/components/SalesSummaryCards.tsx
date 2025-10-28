import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';

interface SalesSummary {
  totalToday: number;
  avgDaily: number;
  trend: 'up' | 'down' | 'stable' | 'insufficient_data';
  trendPercentage: number;
}

export default function SalesSummaryCards() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'  // Bypass ngrok warning (safe for production)
      };

      const totalTodayRes = await axios.get(`${BACKEND_URL}/api/analytics/total-sales-today`, { headers });
      const avgDailyRes = await axios.get(`${BACKEND_URL}/api/analytics/avg-daily-sales`, { headers });

      setSummary({
        totalToday: totalTodayRes.data.total_sales || 0,
        avgDaily: avgDailyRes.data.average_daily_sales || 0,
        trend: avgDailyRes.data.trend || 'insufficient_data',
        trendPercentage: avgDailyRes.data.trend_percentage || 0,
      });
    } catch (err) {
      console.error('Error fetching sales summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Helper para obtener icono y color de tendencia
  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | 'insufficient_data') => {
    switch (trend) {
      case 'up':
        return { name: 'trending-up' as const, color: '#32cd32' }; // Verde
      case 'down':
        return { name: 'trending-down' as const, color: '#ff5858' }; // Rojo
      case 'stable':
        return { name: 'remove-outline' as const, color: '#ffae42' }; // Amarillo
      case 'insufficient_data':
        return null; // No mostrar icono cuando no hay datos suficientes
      default:
        return null;
    }
  };

  if (loading) {
    return <ActivityIndicator color="#fff" style={styles.loader} />;
  }

  const trendIcon = getTrendIcon(summary?.trend || 'insufficient_data');

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="cash-outline" size={28} color="#32cd32" />
        <Text style={styles.cardTitle}>Ventas de Hoy</Text>
        <Text style={styles.cardValue}>${summary?.totalToday.toFixed(2)}</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="stats-chart-outline" size={28} color="#00f2fe" />
          {trendIcon && (
            <Ionicons name={trendIcon.name} size={22} color={trendIcon.color} style={styles.trendIcon} />
          )}
        </View>
        <Text style={styles.cardTitle}>Promedio Diario (7d)</Text>
        <Text style={styles.cardValue}>${summary?.avgDaily.toFixed(2)}</Text>
        {summary?.trend !== 'stable' && summary?.trend !== 'insufficient_data' && (
          <Text style={[styles.trendText, { color: trendIcon?.color }]}>
            {summary?.trend === 'up' ? '↗' : '↘'} {Math.abs(summary?.trendPercentage || 0).toFixed(0)}%
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendIcon: {
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  loader: {
    marginVertical: 20,
  },
});