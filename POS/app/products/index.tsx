import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function ProductListScreen() {
  const [products, setProducts] = useState([]);
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

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`${BACKEND_URL}/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Product deleted successfully!');
              fetchProducts(); // Refresh the list
            } catch (error: any) {
              console.error('Error deleting product:', error.response?.data || error.message);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete product.');
            }
          },
        },
      ]
    );
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

    return (
      <Animated.View style={[styles.productItemContainer, { transform: [{ scale }], opacity }]}>
        <BlurView intensity={40} tint="light" style={styles.productItem}>
            <View style={styles.productInfo}>
              <View style={styles.productIcon}>
                <Ionicons name="cube-outline" size={30} color="#fff" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDetail}>Code: {item.code}</Text>
                <Text style={styles.productDetail}>Stock: {item.stock}</Text>
              </View>
              <Text style={styles.productPrice}>${(parseFloat(item.sale_price) || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => router.push(`/products/manage?id=${item.id}`)}>
                <Ionicons name="pencil-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Products</Text>
        <View style={{width: 40}}/>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#fff" /></View>
      ) : products.length === 0 ? (
        <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={60} color="rgba(255,255,255,0.7)"/>
            <Text style={styles.emptyText}>No products found.</Text>
            <Text style={styles.emptySubText}>Add a new product to get started.</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={products}
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

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/products/manage')}>
        <LinearGradient 
            colors={['#f093fb', '#f5576c']} 
            style={styles.addButtonGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
        >
            <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for add button
  },
  productItemContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  productItem: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  productIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  productDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 'auto',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 15,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#4facfe',
  },
  deleteButton: {
    backgroundColor: '#ff5858',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
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
  emptySubText: {
    marginTop: 5,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});