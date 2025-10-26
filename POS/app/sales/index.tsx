import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/app/constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAlert, alertHelpers } from '../components/AlertProvider';
import { QRScanner } from '../components/QRScanner';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = width * 0.7;

export default function SalesScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingSale, setProcessingSale] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();
  
  // Función para manejar producto escaneado
  const handleProductScanned = (scannedProduct: any) => {
    // Buscar el producto en la lista de productos
    const existingProduct = products.find(p => p.id === scannedProduct.id);
    
    if (existingProduct) {
      // Usar el producto de la lista (con datos actualizados)
      addToCart(existingProduct);
      // No mostrar alert para escaneo continuo
    } else {
      // Si no se encuentra, usar los datos del QR
      addToCart(scannedProduct);
      // No mostrar alert para escaneo continuo
    }
  };
  
  // Animaciones
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const cartBounce = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const checkoutPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchProducts();
    startAnimations();
  }, []);

  useEffect(() => {
    // Animación shimmer continua
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Animación de pulso
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Animación de checkout button cuando hay items
    if (cart.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(checkoutPulse, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(checkoutPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [cart.length]);

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

  const animateCartBadge = () => {
    Animated.sequence([
      Animated.spring(cartBounce, {
        toValue: 1.3,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(cartBounce, {
        toValue: 1,
        friction: 3,
        tension: 40,
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

  const handleCartUpdate = (newCart: any[]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCart(newCart);
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    if (currentQuantity >= product.stock) {
      alertHelpers.warning(showAlert, 'Stock Insuficiente', 
        `No hay suficiente stock de ${product.name}. Stock disponible: ${product.stock}`);
      return;
    }
    
    animateCartBadge();
    
    if (existingItem) {
      handleCartUpdate(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      handleCartUpdate([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    handleCartUpdate(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      const product = products.find(p => p.id === productId);
      if (product && quantity > product.stock) {
        alertHelpers.warning(showAlert, 'Stock Insuficiente', 
          `No hay suficiente stock de ${product.name}. Stock disponible: ${product.stock}`);
        return;
      }
      
      handleCartUpdate(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (parseFloat(item.sale_price) || 0) * item.quantity, 0);
  }, [cart]);

  const calculateSubtotal = useMemo(() => calculateTotal, [calculateTotal]);
  const calculateTax = useMemo(() => calculateTotal * 0.16, [calculateTotal]); // 16% IVA
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

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

  const processSale = async () => {
    if (cart.length === 0) {
      alertHelpers.warning(showAlert, 'Carrito Vacío', 'Agrega productos al carrito antes de proceder con la venta.');
      return;
    }

    setProcessingSale(true);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      console.log('User data:', user); // Debug: ver qué datos tiene el usuario

      // Create sale data with proper structure for backend
      const saleData: any = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: parseFloat(item.sale_price),
          total_price: parseFloat(item.sale_price) * item.quantity
        })),
        payment_method: 'cash', // Default payment method
        total_amount: calculateTotal
      };
      
      // Backend will use JWT user ID directly, no need to send employee_id
      
      console.log('Sale data being sent:', saleData); // Debug: ver datos de venta

      console.log('Sending sale request...');
      const response = await axios.post(`${BACKEND_URL}/api/sales`, saleData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Sale response:', response.data);

      // El backend ya actualizó el stock, solo necesitamos refrescar la lista
      console.log('Refreshing products...');
      await fetchProducts();

      alertHelpers.success(showAlert, '¡Venta Exitosa! 🎉', 
        `Venta procesada por $${calculateTotal.toFixed(2)}. Recibo #${response.data.id}`, 
        () => {
          setCart([]);
          setSearchQuery('');
        }
      );

    } catch (error: any) {
      console.error('Error processing sale:', error.response?.data || error.message);
      alertHelpers.error(showAlert, 'Error en la Venta', 
        error.response?.data?.message || 'No se pudo procesar la venta. Intenta de nuevo.');
    } finally {
      setProcessingSale(false);
    }
  };

  const renderCategoryPill = (category: string) => {
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
              colors={['#f093fb', '#f5576c']}
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
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-PRODUCT_CARD_WIDTH, PRODUCT_CARD_WIDTH],
    });

    const stock = parseInt(item.stock, 10) || 0;
    const isLowStock = stock <= 10;
    const isOutOfStock = stock === 0;

    return (
      <Animated.View 
        style={[
          styles.productCard,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => !isOutOfStock && addToCart(item)}
          disabled={isOutOfStock}
        >
          <BlurView intensity={20} tint="dark" style={styles.productBlur}>
            <LinearGradient
              colors={isOutOfStock 
                ? ['rgba(255,88,88,0.2)', 'rgba(255,27,27,0.1)']
                : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.productGradient}
            >
              {/* Shimmer effect */}
              <Animated.View 
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] }
                ]}
              />

              {/* Product Icon */}
              <View style={styles.productIconContainer}>
                <LinearGradient
                  colors={isOutOfStock 
                    ? ['#ff5858', '#ff1b1b']
                    : isLowStock 
                    ? ['#fa709a', '#fee140']
                    : ['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.productIcon}
                >
                  <Ionicons 
                    name={isOutOfStock ? "close-circle" : "cube"} 
                    size={32} 
                    color="#fff" 
                  />
                </LinearGradient>
                
                {/* Stock badge */}
                {!isOutOfStock && (
                  <Animated.View 
                    style={[
                      styles.stockBadge,
                      { transform: [{ scale: isLowStock ? pulseAnim : 1 }] }
                    ]}
                  >
                    <LinearGradient
                      colors={isLowStock ? ['#fa709a', '#fee140'] : ['#43e97b', '#38f9d7']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.stockBadgeGradient}
                    >
                      <Text style={styles.stockBadgeText}>{stock}</Text>
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>

              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                
                <View style={styles.productMetaRow}>
                  <View style={styles.productMeta}>
                    <Ionicons name="barcode-outline" size={14} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.productCode}>{item.code}</Text>
                  </View>
                  {item.category && (
                    <View style={styles.productCategoryBadge}>
                      <Text style={styles.productCategoryText}>{item.category}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.productPriceRow}>
                  <Ionicons name="cash-outline" size={18} color="#43e97b" />
                  <Text style={styles.productPrice}>
                    ${(parseFloat(item.sale_price) || 0).toFixed(2)}
                  </Text>
                </View>

                {isOutOfStock && (
                  <View style={styles.outOfStockBanner}>
                    <Ionicons name="warning" size={14} color="#ff5858" />
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  </View>
                )}
        </View>

              {/* Add Button */}
              {!isOutOfStock && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addToCart(item)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addButtonGradient}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCartItem = ({ item, index }: { item: any; index: number }) => {
    const itemTotal = (parseFloat(item.sale_price) || 0) * item.quantity;

    return (
      <Animated.View style={[styles.cartItemContainer, { opacity: fadeAnim }]}>
        <BlurView intensity={20} tint="dark" style={styles.cartItemBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cartItemGradient}
          >
            {/* Product Icon Small */}
            <View style={styles.cartItemIcon}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cartItemIconGradient}
              >
                <Ionicons name="cube" size={20} color="#fff" />
              </LinearGradient>
            </View>

            {/* Item Info */}
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.cartItemPriceRow}>
                <Text style={styles.cartItemUnitPrice}>
                  ${(parseFloat(item.sale_price) || 0).toFixed(2)}
                </Text>
                <Text style={styles.cartItemMultiplier}>×</Text>
                <Text style={styles.cartItemQuantityLabel}>{item.quantity}</Text>
              </View>
            </View>

            {/* Quantity Controls */}
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                style={styles.quantityButton}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.quantityButtonGradient}
                >
                  <Ionicons name="remove" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                style={styles.quantityButton}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  style={styles.quantityButtonGradient}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Item Total */}
            <View style={styles.cartItemTotalContainer}>
              <Text style={styles.cartItemTotal}>
                ${itemTotal.toFixed(2)}
              </Text>
            </View>

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFromCart(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#ff5858" />
            </TouchableOpacity>
          </LinearGradient>
    </BlurView>
      </Animated.View>
  );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fondo oscuro elegante */}
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
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => router.push('/')} 
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
        <Text style={styles.title}>New Sale</Text>
          <Text style={styles.subtitle}>Point of Sale</Text>
      </View>

        {/* Header Actions */}
        <View style={styles.headerActions}>
          {/* QR Scanner Button */}
          <TouchableOpacity 
            onPress={() => setShowQRScanner(true)} 
            style={styles.qrButton}
            activeOpacity={0.8}
          >
            <View style={styles.qrButtonInner}>
              <Ionicons name="qr-code" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Cart Badge */}
        <Animated.View style={[styles.cartBadgeContainer, { transform: [{ scale: cartBounce }] }]}>
          <View style={styles.cartBadge}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.cartBadgeGradient}
            >
              <Ionicons name="cart" size={20} color="#fff" />
              {cart.length > 0 && (
                <View style={styles.cartCountBadge}>
                  <Text style={styles.cartCountText}>{cart.length}</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View 
        style={[
          styles.searchContainer,
          { opacity: fadeAnim }
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
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Categories */}
      <Animated.View style={[styles.categoriesContainer, { opacity: fadeAnim }]}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => renderCategoryPill(item)}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </Animated.View>

      {/* Products Section */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Products</Text>
          <Text style={styles.sectionCount}>{filteredProducts.length} items</Text>
      </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f093fb" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
            snapToInterval={PRODUCT_CARD_WIDTH + 16}
            decelerationRate="fast"
            />
        )}
      </View>

      {/* Cart Section */}
      <View style={styles.cartSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shopping Cart</Text>
          <View style={styles.cartInfoBadge}>
            <Ionicons name="cart-outline" size={16} color="#f093fb" />
            <Text style={styles.cartInfoText}>{totalItems} items</Text>
          </View>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Ionicons name="cart-outline" size={50} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyCartText}>Cart is empty</Text>
            <Text style={styles.emptyCartSubtext}>Add products to start a sale</Text>
          </View>
        ) : (
            <FlatList
                data={cart}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
            />
        )}
      </View>

      {/* Footer with Total and Checkout */}
      {cart.length > 0 && (
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <BlurView intensity={40} tint="dark" style={styles.footerBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.footerGradient}
            >
              {/* Summary */}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${calculateSubtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax (16%)</Text>
                  <Text style={styles.summaryValue}>${calculateTax.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>${(calculateSubtotal + calculateTax).toFixed(2)}</Text>
                </View>
        </View>

              {/* Checkout Button */}
              <Animated.View style={{ transform: [{ scale: checkoutPulse }] }}>
                <TouchableOpacity
                  style={[
                    styles.checkoutButton,
                    processingSale && styles.checkoutButtonDisabled
                  ]}
                  onPress={processSale}
                  disabled={processingSale}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={processingSale 
                      ? ['#ccc', '#999'] 
                      : ['#f093fb', '#f5576c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.checkoutGradient}
                  >
                    {processingSale ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        <Text style={styles.checkoutText}>Complete Sale</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      )}

      {/* QR Scanner Modal */}
      <QRScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onProductScanned={handleProductScanned}
      />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(79,172,254,0.5)',
  },
  qrButtonInner: {
    flex: 1,
    backgroundColor: 'rgba(79,172,254,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  cartBadgeContainer: {
    width: 44,
    height: 44,
  },
  cartBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(240,147,251,0.5)',
  },
  cartBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff5858',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f0c29',
  },
  cartCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  productsSection: {
      marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  productsList: {
    paddingHorizontal: 20,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    marginRight: 16,
  },
  productBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  productGradient: {
    padding: 16,
    minHeight: 180,
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
  productIconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative',
  },
  productIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  stockBadge: {
    position: 'absolute',
    top: -6,
    left: 46,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0f0c29',
  },
  stockBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productCode: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  productCategoryBadge: {
    backgroundColor: 'rgba(102,126,234,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.5)',
  },
  productCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#667eea',
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#43e97b',
  },
  outOfStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,88,88,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,88,88,0.4)',
  },
  outOfStockText: {
    color: '#ff5858',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(240,147,251,0.5)',
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
  cartSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(240,147,251,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(240,147,251,0.3)',
  },
  cartInfoText: {
    color: '#f093fb',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  emptyCartSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  cartList: {
    paddingBottom: 20,
  },
  cartItemContainer: {
    marginBottom: 12,
  },
  cartItemBlur: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cartItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  cartItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.5)',
    marginRight: 12,
  },
  cartItemIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cartItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartItemUnitPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  cartItemMultiplier: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  cartItemQuantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quantityButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 24,
    textAlign: 'center',
  },
  cartItemTotalContainer: {
    marginRight: 12,
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#43e97b',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,88,88,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,88,88,0.3)',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerBlur: {
    overflow: 'hidden',
  },
  footerGradient: {
    padding: 20,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryRow: {
      flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#43e97b',
  },
  checkoutButton: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(240,147,251,0.5)',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutGradient: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    paddingVertical: 16,
      gap: 10,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});