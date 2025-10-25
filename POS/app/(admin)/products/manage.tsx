import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAlert, alertHelpers } from '../../components/AlertProvider';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  code: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  category: string;
  provider_id: string;
  image_url: string;
}

export default function ManageProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { showAlert } = useAlert();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    fetchProducts();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
    } catch (error: any) {
      alertHelpers.error(
        showAlert,
        'Error',
        error.response?.data?.message || 'No se pudieron cargar los productos.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/(admin)/products?id=${productId}`);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.delete(`${BACKEND_URL}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setProducts(prev => prev.filter(p => p.id !== productId));
      alertHelpers.success(showAlert, 'Producto Eliminado', `${productName} ha sido eliminado correctamente.`);
    } catch (error: any) {
      alertHelpers.error(
        showAlert,
        'Error',
        error.response?.data?.message || 'No se pudo eliminar el producto.'
      );
    }
  };

  const filteredProducts = products.filter(product =>
    (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductCard = ({ item, index }: { item: Product; index: number }) => {

    const stock = parseInt(String(item.stock)) || 0;
    const isLowStock = stock < 10;
    const isOutOfStock = stock === 0;

    return (
      <Animated.View
        style={[
          styles.productCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim,
              },
            ],
          },
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
          <LinearGradient
            colors={
              isOutOfStock
                ? ['rgba(255,88,88,0.2)', 'rgba(255,88,88,0.1)']
                : isLowStock
                ? ['rgba(255,193,7,0.2)', 'rgba(255,193,7,0.1)']
                : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productCode}>{item.code}</Text>
              </View>
              <View style={styles.stockBadge}>
                <LinearGradient
                  colors={
                    isOutOfStock
                      ? ['#ff5858', '#ff6b6b']
                      : isLowStock
                      ? ['#ffc107', '#ffd43b']
                      : ['#43e97b', '#38f9d7']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stockBadgeGradient}
                >
                  <Text style={styles.stockText}>
                    {isOutOfStock ? 'Sin Stock' : `${stock} unidades`}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            {/* Details */}
            <View style={styles.cardDetails}>
              <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Compra</Text>
                  <Text style={styles.priceValue}>${(parseFloat(String(item.purchase_price)) || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Venta</Text>
                  <Text style={styles.salePriceValue}>${(parseFloat(String(item.sale_price)) || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Ganancia</Text>
                  <Text style={styles.profitValue}>
                    ${((parseFloat(String(item.sale_price)) || 0) - (parseFloat(String(item.purchase_price)) || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>

              {item.category && (
                <View style={styles.categoryRow}>
                  <Ionicons name="pricetag" size={14} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditProduct(item.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="create" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Editar</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteProduct(item.id, item.name)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ff5858', '#ff6b6b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Eliminar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0f0c29', '#302b63', '#24243e']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fondo */}
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Gestionar Productos</Text>
          <Text style={styles.subtitle}>{products.length} productos registrados</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(admin)/products')}
          style={styles.addButton}
        >
          <View style={styles.addButtonInner}>
            <Ionicons name="add" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.searchBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchGradient}
          >
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Products List */}
      <Animated.View
        style={[
          styles.listContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Crea tu primer producto'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(admin)/products')}
              >
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyButtonGradient}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Crear Producto</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#f093fb"
                colors={['#f093fb']}
              />
            }
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
  },
  addButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(240,147,251,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240,147,251,0.3)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  productCard: {
    marginBottom: 16,
  },
  cardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  stockBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  stockBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardDetails: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  salePriceValue: {
    fontSize: 14,
    color: '#43e97b',
    fontWeight: 'bold',
  },
  profitValue: {
    fontSize: 14,
    color: '#f093fb',
    fontWeight: 'bold',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
