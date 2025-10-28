import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/app/constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAlert, alertHelpers } from '../components/AlertProvider';

const { width, height } = Dimensions.get('window');

export default function InventoryScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();
  const { showAlert } = useAlert();
  
  // Animaciones
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const searchFocusAnim = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      startAnimations();
    }, [])
  );

  useEffect(() => {
    // Animación shimmer continua
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();

    // Animación de pulso para badges
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
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
    ]).start();
  };

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
      alertHelpers.error(showAlert, 'Error', error.response?.data?.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(products.map(p => p.category || 'Other'))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => (p.category || 'Other') === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter((product: any) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => parseInt(p.stock, 10) <= 10).length;
    const outOfStock = products.filter(p => parseInt(p.stock, 10) === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.sale_price) * parseInt(p.stock, 10)), 0);
    
    return { total, lowStock, outOfStock, totalValue };
  }, [products]);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: '#ff5858', label: 'Out', gradient: ['#ff5858', '#ff1b1b'], icon: 'alert-circle' };
    if (stock <= 10) return { color: '#ffae42', label: 'Low', gradient: ['#fa709a', '#fee140'], icon: 'warning' };
    if (stock <= 50) return { color: '#4facfe', label: 'Med', gradient: ['#4facfe', '#00f2fe'], icon: 'checkmark-circle' };
    return { color: '#43e97b', label: 'High', gradient: ['#43e97b', '#38f9d7'], icon: 'checkmark-done-circle' };
  };

  const handleSearchFocus = () => {
    Animated.spring(searchFocusAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchBlur = () => {
    Animated.spring(searchFocusAnim, {
      toValue: 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const renderCategoryPill = (category: string, index: number) => {
    const isSelected = selectedCategory === category;
    
    return (
      <TouchableOpacity
        key={category}
        activeOpacity={0.8}
        onPress={() => setSelectedCategory(category)}
      >
        <Animated.View style={[styles.categoryPill, { opacity: fadeAnim }]}>
          {isSelected ? (
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryPillGradient}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.categoryPillTextSelected}>
                {category === 'all' ? 'All' : category}
              </Text>
            </LinearGradient>
          ) : (
            <BlurView intensity={20} tint="dark" style={styles.categoryPillBlur}>
              <Text style={styles.categoryPillText}>
                {category === 'all' ? 'All' : category}
              </Text>
            </BlurView>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const inputRange = [-1, 0, 100 * index, 100 * (index + 2)];
    const opacityInputRange = [-1, 0, 100 * index, 100 * (index + 0.5)];

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.8],
    });

    const opacity = scrollY.interpolate({
      inputRange: opacityInputRange,
      outputRange: [1, 1, 1, 0],
    });

    const stock = parseInt(item.stock, 10) || 0;
    const price = parseFloat(item.sale_price) || 0;
    const stockStatus = getStockStatus(stock);

    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width, width],
    });

    return (
      <Animated.View 
        style={[
          styles.itemContainer, 
          { 
            transform: [{ scale }], 
            opacity,
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            // Navegar a detalles del producto
            alertHelpers.info(showAlert, 'Detalles del Producto', `${item.name}\nStock: ${stock}\nPrecio: $${price.toFixed(2)}`);
          }}
        >
          <BlurView intensity={20} tint="dark" style={styles.item}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.itemGradient}
            >
              {/* Efecto shimmer */}
              <Animated.View 
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] }
                ]}
              />

              {/* Ícono del producto con gradiente */}
              <View style={styles.itemIconContainer}>
                <LinearGradient
                  colors={stockStatus.gradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.itemIcon}
                >
                  <Ionicons name="cube" size={28} color="#fff" />
                </LinearGradient>
                
                {/* Badge de estado */}
                <Animated.View 
                  style={[
                    styles.statusBadge,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <LinearGradient
                    colors={stockStatus.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statusBadgeGradient}
                  >
                    <Ionicons name={stockStatus.icon as any} size={12} color="#fff" />
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Información del producto */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.itemMetaRow}>
                  <View style={styles.itemMetaItem}>
                    <Ionicons name="barcode-outline" size={14} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.itemDetail}>{item.code}</Text>
                  </View>
                  {item.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceRow}>
                  <Ionicons name="cash-outline" size={16} color="#43e97b" />
                  <Text style={styles.priceText}>${price.toFixed(2)}</Text>
                </View>
              </View>

              {/* Stock info */}
              <View style={styles.stockContainer}>
                <LinearGradient
                  colors={[...stockStatus.gradient, 'rgba(255,255,255,0.1)'] as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stockGradient}
                >
                  <Text style={styles.stockNumber}>{stock}</Text>
                  <Text style={styles.stockLabel}>{stockStatus.label}</Text>
                </LinearGradient>
              </View>

              {/* Indicador de acción */}
              <View style={styles.actionIndicator}>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  const searchScale = searchFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <View style={[styles.container, { backgroundColor: '#0f0c29' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Fondo con gradiente oscuro */}
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header animado */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>{filteredProducts.length} products</Text>
        </View>
        
        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.8}>
          <Ionicons name="options-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Estadísticas */}
      <Animated.View 
        style={[
          styles.statsContainer,
          { opacity: fadeAnim }
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.statsBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={20} color="#4facfe" />
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="warning-outline" size={20} color="#ffae42" />
              <Text style={styles.statValue}>{stats.lowStock}</Text>
              <Text style={styles.statLabel}>Low</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={20} color="#43e97b" />
              <Text style={styles.statValue}>${(stats.totalValue / 1000).toFixed(1)}k</Text>
              <Text style={styles.statLabel}>Value</Text>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Buscador mejorado */}
      <Animated.View 
        style={[
          styles.searchContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: searchScale }],
          }
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.searchBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchGradient}
          >
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Categorías */}
      <Animated.View style={[styles.categoriesContainer, { opacity: fadeAnim }]}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item, index }) => renderCategoryPill(item, index)}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </Animated.View>

      {/* Lista de productos */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4facfe" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
          <BlurView intensity={20} tint="dark" style={styles.emptyBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyGradient}
            >
              <Ionicons name="cube-outline" size={80} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'Try adjusting your search' 
                  : 'Start by adding products to inventory'}
              </Text>
            </LinearGradient>
          </BlurView>
        </Animated.View>
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
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
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
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  statsBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsGradient: {
    flexDirection: 'row',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#fff',
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryPill: {
    marginRight: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  categoryPillBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryPillTextSelected: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  emptyBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyGradient: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemContainer: {
    marginBottom: 16,
  },
  item: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  itemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ skewX: '-20deg' }],
  },
  itemIconContainer: {
    position: 'relative',
    marginRight: 14,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0f0c29',
  },
  statusBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  itemMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  categoryBadge: {
    backgroundColor: 'rgba(102,126,234,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.5)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#667eea',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#43e97b',
  },
  stockContainer: {
    marginLeft: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stockGradient: {
    width: 50,
    paddingVertical: 8,
    alignItems: 'center',
  },
  stockNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  stockLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  actionIndicator: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});