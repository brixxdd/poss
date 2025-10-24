import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../constants/config'; // Adjusted import path
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function ManageProductScreen() {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    purchase_price: '',
    sale_price: '',
    stock: '',
    provider_id: '',
    category: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (id) {
      fetchProduct(id as string);
    } else {
        setFormReady(true);
    }
  }, [id]);

  useEffect(() => {
      if(formReady){
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true })
        ]).start();
      }
  }, [formReady])

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const product = response.data;
      setFormData({
          name: product.name || '',
          code: product.code || '',
          purchase_price: product.purchase_price?.toString() || '',
          sale_price: product.sale_price?.toString() || '',
          stock: product.stock?.toString() || '',
          provider_id: product.provider_id || '',
          category: product.category || '',
          image_url: product.image_url || '',
      });
      setFormReady(true);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch product data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sale_price) {
        Alert.alert('Validation Error', 'Product Name and Sale Price are required.');
        return;
    }
    setLoading(true);
    const productData = {
      ...formData,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      sale_price: parseFloat(formData.sale_price) || 0,
      stock: parseInt(formData.stock) || 0,
      provider_id: formData.provider_id || null,
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = isEditing ? `${BACKEND_URL}/api/products/${id}` : `${BACKEND_URL}/api/products`;
      const method = isEditing ? 'put' : 'post';
      
      await axios[method](url, productData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Success', `Product ${isEditing ? 'updated' : 'created'} successfully!`);
      router.replace('/(admin)/products'); // Adjusted routing
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (key: keyof typeof formData, placeholder: string, icon: any, keyboardType: any = 'default') => (
      <View style={styles.inputContainer}>
          <Ionicons name={icon} size={22} color="rgba(255,255,255,0.7)" style={styles.inputIcon}/>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={formData[key]}
            onChangeText={(text) => handleInputChange(key, text)}
            keyboardType={keyboardType}
            editable={!loading}
          />
      </View>
  )

  if (!formReady) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#fff"/>
        </View>
      )
  }

  return (
    <View style={{flex: 1}}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
        <View style={{width: 40}}/>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={[styles.formContainer, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
            <BlurView intensity={30} tint="light" style={styles.formBlur}>
                {renderInput('name', 'Product Name', 'cube-outline')}
                {renderInput('code', 'Code (EAN/UPC)', 'barcode-outline')}
                <View style={{flexDirection: 'row', gap: 15}}>
                    <View style={{flex: 1}}>{renderInput('purchase_price', 'Purchase Price', 'trending-down-outline', 'numeric')}</View>
                    <View style={{flex: 1}}>{renderInput('sale_price', 'Sale Price', 'trending-up-outline', 'numeric')}</View>
                </View>
                {renderInput('stock', 'Stock Quantity', 'file-tray-full-outline', 'numeric')}
                {renderInput('category', 'Category', 'pricetag-outline')}
                {renderInput('provider_id', 'Provider ID (Optional)', 'business-outline')}
                {renderInput('image_url', 'Image URL (Optional)', 'image-outline')}

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                    <LinearGradient colors={loading ? ['#ccc', '#999'] : ['#f093fb', '#f5576c']} style={styles.submitGradient} start={{x:0, y:0}} end={{x:1,y:1}}>
                        {loading ? 
                            <ActivityIndicator color="#fff"/> : 
                            <>
                                <Text style={styles.submitText}>{isEditing ? 'Update Product' : 'Create Product'}</Text>
                                <Ionicons name={isEditing ? 'checkmark-circle-outline' : 'add-circle-outline'} size={22} color="#fff" />
                            </>
                        }
                    </LinearGradient>
                </TouchableOpacity>
            </BlurView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: { padding: 5 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
      flex: 1,
  },
  formBlur: {
      borderRadius: 30,
      padding: 25,
      overflow: 'hidden',
  },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 15,
      marginBottom: 15,
      paddingHorizontal: 15,
  },
  inputIcon: {
      marginRight: 10,
  },
  input: {
    height: 55,
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
      height: 55,
      borderRadius: 15,
      overflow: 'hidden',
      marginTop: 10,
  },
  submitGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
  },
  submitText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
  }
});