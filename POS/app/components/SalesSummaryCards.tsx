import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';

export default function SalesSummaryCards() {
  const [summary, setSummary] = useState<{ totalToday: number; avgDaily: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const totalTodayRes = await axios.get(`${BACKEND_URL}/api/analytics/total-sales-today`, { headers });
      const avgDailyRes = await axios.get(`${BACKEND_URL}/api/analytics/avg-daily-sales`, { headers });

      setSummary({
        totalToday: totalTodayRes.data.total_sales || 0,
        avgDaily: avgDailyRes.data.average_daily_sales || 0,
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

  if (loading) {
    return <ActivityIndicator color="#fff" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="cash-outline" size={28} color="#32cd32" />
        <Text style={styles.cardTitle}>Ventas de Hoy</Text>
        <Text style={styles.cardValue}>${summary?.totalToday.toFixed(2)}</Text>
      </View>
      <View style={styles.card}>
        <Ionicons name="stats-chart-outline" size={28} color="#00f2fe" />
        <Text style={styles.cardTitle}>Promedio Diario (7d)</Text>
        <Text style={styles.cardValue}>${summary?.avgDaily.toFixed(2)}</Text>
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
  loader: {
    marginVertical: 20,
  },
});