import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SalesScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleCartUpdate = (newCart: any[]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCart(newCart);
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
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

  const filteredProducts = useMemo(() => 
    products.filter((product: any) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, searchQuery]);

  const renderProduct = ({ item }: { item: any }) => (
    <BlurView intensity={30} tint="light" style={styles.productItem}>
      <View style={{flex: 1}}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetail}>Stock: {item.stock}</Text>
        <Text style={styles.productPrice}>${(parseFloat(item.sale_price) || 0).toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(item)}>
        <Ionicons name="add-circle-outline" size={32} color="#fff" />
      </TouchableOpacity>
    </BlurView>
  );

  const renderCartItem = ({ item }: { item: any }) => (
    <BlurView intensity={50} tint="light" style={styles.cartItem}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>${(parseFloat(item.sale_price) || 0).toFixed(2)}</Text>
        <View style={styles.quantityControl}>
            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)}><Ionicons name="remove-circle-outline" size={28} color="#fff" /></TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}><Ionicons name="add-circle-outline" size={28} color="#fff" /></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
            <Ionicons name="trash-outline" size={24} color="#ff5858" />
        </TouchableOpacity>
    </BlurView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>New Sale</Text>
        <View style={{width: 40}}/>
      </View>

      <View style={styles.searchContainer}>
        <BlurView intensity={30} tint="light" style={styles.searchBlur}>
            <Ionicons name="search-outline" size={20} color="#fff" style={{marginLeft: 15}}/>
            <TextInput
                style={styles.searchInput}
                placeholder="Search products by name or code..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </BlurView>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Products</Text>
        {loading ? 
            <ActivityIndicator color="#fff" size="large" style={{marginTop: 50}}/> :
            <Animated.FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{paddingHorizontal: 20}}
                style={styles.productsList}
            />
        }
      </View>

      <View style={[styles.content, styles.cartSection]}>
        <Text style={styles.sectionTitle}>Cart ({cart.length})</Text>
        {cart.length > 0 ?
            <FlatList
                data={cart}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{paddingBottom: 20}}
            />
            : <View style={styles.emptyCartContainer}><Text style={styles.emptyCartText}>Cart is empty</Text></View>
        }
      </View>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>${calculateTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => Alert.alert('Info', 'Checkout functionality coming soon!')}>
            <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.checkoutGradient} start={{x:0, y:0}} end={{x:1,y:1}}>
                <Text style={styles.checkoutText}>Checkout</Text>
                <Ionicons name="arrow-forward-outline" size={22} color="#fff" />
            </LinearGradient>
        </TouchableOpacity>
      </View>
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
  content: {
      paddingHorizontal: 20,
      marginBottom: 15,
  },
  cartSection: {
      flex: 1,
      paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingHorizontal: 20
  },
  productsList: {
      height: 130,
  },
  productItem: {
    width: 250,
    height: 110,
    borderRadius: 20,
    padding: 15,
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  productDetail: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  productPrice: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 5 },
  addToCartButton: {
      marginLeft: 15,
      padding: 10,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    marginHorizontal: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cartItemName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff' },
  cartItemPrice: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginRight: 15 },
  quantityControl: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginRight: 15,
  },
  quantityText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  removeButton: { padding: 5 },
  emptyCartContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCartText: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  footer: {
      flexDirection: 'row',
      padding: 20,
      borderTopWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      backgroundColor: 'rgba(0,0,0,0.2)',
  },
  totalContainer: { flex: 1, justifyContent: 'center' },
  totalLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  checkoutButton: { width: 150, height: 55, borderRadius: 15, overflow: 'hidden' },
  checkoutGradient: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
  },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
