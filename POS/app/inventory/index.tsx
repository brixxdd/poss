import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/app/constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function InventoryScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
    } catch (error: any) {
      console.error('Error fetching products:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => 
    products.filter((product: any) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, searchQuery]);

  const getStockColor = (stock: number) => {
    if (stock <= 10) return '#ff5858'; // Red for low stock
    if (stock <= 50) return '#ffae42'; // Orange for medium stock
    return '#32cd32'; // Green for high stock
  };

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const inputRange = [-1, 0, 150 * index, 150 * (index + 2)];
    const opacityInputRange = [-1, 0, 150 * index, 150 * (index + 0.5)];

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0],
    });

    const opacity = scrollY.interpolate({
      inputRange: opacityInputRange,
      outputRange: [1, 1, 1, 0],
    });

    const stock = parseInt(item.stock, 10) || 0;

    return (
      <Animated.View style={[styles.itemContainer, { transform: [{ scale }], opacity }]}>
        <BlurView intensity={40} tint="light" style={styles.item}>
            <View style={styles.itemIcon}>
                <Ionicons name="cube-outline" size={30} color="#fff" />
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetail}>Code: {item.code}</Text>
                <Text style={styles.itemDetail}>Price: ${(parseFloat(item.sale_price) || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.stockContainer}>
                <Text style={[styles.stockText, { color: getStockColor(stock) }]}>{stock}</Text>
                <Text style={styles.stockLabel}>In Stock</Text>
            </View>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#00f2fe', '#4facfe']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Inventory</Text>
        <View style={{width: 40}}/>
      </View>

      <View style={styles.searchContainer}>
        <BlurView intensity={30} tint="light" style={styles.searchBlur}>
            <Ionicons name="search-outline" size={20} color="#fff" style={{marginLeft: 15}}/>
            <TextInput
                style={styles.searchInput}
                placeholder="Search by name or code..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </BlurView>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#fff" /></View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={60} color="rgba(255,255,255,0.7)"/>
            <Text style={styles.emptyText}>No products found.</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
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
    paddingBottom: 10,
  },
  backButton: { padding: 5 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
      paddingHorizontal: 20,
      marginBottom: 15,
  },
  searchBlur: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 25,
      overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  item: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 2,
  },
  stockContainer: {
      alignItems: 'center',
      marginLeft: 15,
      padding: 10,
      borderRadius: 15,
      backgroundColor: 'rgba(0,0,0,0.2)',
  },
  stockText: {
      fontSize: 24,
      fontWeight: 'bold',
  },
  stockLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
  },
});