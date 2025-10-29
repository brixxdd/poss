import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import CustomAlert from '../CustomAlert';

interface TopProduct {
  product_id: string;
  product_name: string;
  total_qty_sold: number;
}

interface TopProductsListProps {
  rangeDays?: number;
  limit?: number;
}

export default function TopProductsList({ rangeDays = 30, limit = 5 }: TopProductsListProps) {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' as 'info' | 'success' | 'warning' | 'error', buttons: [{ text: 'OK' }] });

  const fetchTopProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/analytics/top-products?range=${rangeDays}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true' },
      });
      setTopProducts(response.data);
    } catch (err: any) {
      console.error('Error al obtener productos principales:', err.response?.data || err.message);
      setAlertData({ title: 'Error', message: 'Fallo al obtener productos principales.', type: 'error', buttons: [{ text: 'OK' }] });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  }, [rangeDays, limit]);

  useEffect(() => {
    fetchTopProducts();
  }, [fetchTopProducts]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.loadingText}>Cargando Productos Principales...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={24} color="#ff5858" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (topProducts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noDataText}>No se encontraron productos principales en los últimos {rangeDays} días.</Text>
      </View>
    );
  }

  const renderProductItem = ({ item, index }: { item: TopProduct; index: number }) => (
    <BlurView intensity={40} tint="light" style={styles.itemContainer}>
      <Text style={styles.itemRank}>#{index + 1}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product_name}</Text>
        <Text style={styles.itemQty}>Vendidos: {item.total_qty_sold} unidades</Text>
      </View>
      <Ionicons name="star" size={20} color="#FFD700" />
    </BlurView>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top {limit} Productos (Últimos {rangeDays} Días)</Text>
      <FlatList
        data={topProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.product_id}
        scrollEnabled={false} // Disable scrolling for a fixed list
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
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
  },
  errorText: {
    color: '#ff5858',
    marginTop: 10,
    textAlign: 'center',
  },
  noDataText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    padding: 10,
  },
  listContent: {
    // No specific styles needed here yet
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  itemRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color for rank
    marginRight: 10,
    width: 30,
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  itemQty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});
