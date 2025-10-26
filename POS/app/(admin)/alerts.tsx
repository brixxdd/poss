import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import SalesChart from '../components/SalesChart';
import SalesSummaryCards from '../components/SalesSummaryCards';
import { useAlert, alertHelpers } from '../components/AlertProvider';

export default function AlertsScreen() {
  const { showAlert } = useAlert();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));

      const alertsResponse = await axios.get(`${BACKEND_URL}/api/analytics/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(alertsResponse.data);
    } catch (error: any) {
      console.error('Error fetching data:', error.response?.data || error.message);
      alertHelpers.error(showAlert, 'Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${BACKEND_URL}/api/analytics/run-alerts`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
      alertHelpers.success(showAlert, 'Éxito', 'Las alertas han sido recalculadas.');
    } catch (error: any) {
      console.error('Error running alerts calculation:', error.response?.data || error.message);
      alertHelpers.error(showAlert, 'Error', 'No se pudo ejecutar el cálculo de alertas.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleItemPress = (alertId: number) => {
    setSelectedAlertId(selectedAlertId === alertId ? null : alertId);
  };

  const getSeverityColor = (severity: number) => {
    if (severity === 3) return '#ff5858'; // High
    if (severity === 2) return '#ffae42'; // Medium
    return '#32cd32'; // Low
  };

  const renderAlertItem = ({ item }: { item: any }) => (
    <View style={styles.alertItemWrapper}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => handleItemPress(item.id)}>
        <BlurView intensity={40} tint="light" style={styles.itemContainer}>
          <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(item.severity) }]} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.product_name}</Text>
            <Text style={styles.itemDetail}>Stock Actual: {item.current_stock}</Text>
            <Text style={styles.itemDetail}>
              Agotamiento est. en <Text style={{ fontWeight: 'bold' }}>{item.days_until_stockout} días</Text>
            </Text>
          </View>
          <Ionicons name="warning-outline" size={30} color={getSeverityColor(item.severity)} />
        </BlurView>
      </TouchableOpacity>
      {selectedAlertId === item.id && <SalesChart productId={item.product_id} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Resumen y Alertas</Text>
        {user?.role === 'admin' && (
          <View style={styles.adminButtons}>
            <TouchableOpacity onPress={() => router.push('/analytics')} style={styles.headerButton}>
              <Ionicons name="stats-chart-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing} style={styles.headerButton}>
              {isRefreshing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="refresh-outline" size={28} color="#fff" />}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#fff" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <SalesSummaryCards />
          <Text style={styles.sectionTitle}>Alertas de Stock</Text>
          {alerts.length === 0 ? (
            <View style={styles.centeredMessage}>
              <Ionicons name="checkmark-circle-outline" size={60} color="rgba(255,255,255,0.7)"/>
              <Text style={styles.emptyText}>No hay alertas de stock.</Text>
              <Text style={styles.emptySubText}>¡Todo se ve bien!</Text>
            </View>
          ) : (
            <FlatList
              data={alerts}
              renderItem={renderAlertItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
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
    paddingTop: (StatusBar.currentHeight || 40) + 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: { padding: 5 },
  adminButtons: { flexDirection: 'row' },
  headerButton: { padding: 5, marginLeft: 15 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredMessage: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  alertItemWrapper: {
    paddingHorizontal: 20,
  },
  itemContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  severityIndicator: {
    width: 8,
    height: '100%',
    borderRadius: 4,
    marginRight: 15,
  },
  itemInfo: {
      flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});