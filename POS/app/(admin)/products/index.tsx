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
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { QRGenerator } from '../../components/QRGenerator';
import { pickImage, uploadToCloudinary, requestImagePermissions } from '../../utils/cloudinary';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { CustomAlert } from '../../CustomAlert';

const { width, height } = Dimensions.get('window');

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQR, setShowQR] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' as 'info' | 'success' | 'warning' | 'error', buttons: [{ text: 'OK' }] });
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const inputAnims = useRef<Record<string, Animated.Value>>({
    name: new Animated.Value(0),
    code: new Animated.Value(0),
    purchase_price: new Animated.Value(0),
    sale_price: new Animated.Value(0),
    stock: new Animated.Value(0),
    provider_id: new Animated.Value(0),
    category: new Animated.Value(0),
    image_url: new Animated.Value(0),
  }).current;

  useEffect(() => {
    fetchProviders();
    fetchCategories();
    if (id) {
      fetchProduct(id as string);
    } else {
      setFormReady(true);
    }
  }, [id]);

  useEffect(() => {
    if (formReady) {
      startAnimations();
    }
  }, [formReady]);

  useEffect(() => {
    // Animación shimmer continua
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const showCustomAlert = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ) => {
    setAlertData({
      title,
      message,
      type,
      buttons: buttons || [{ text: 'OK' }],
    });
    setAlertVisible(true);
  };

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

  const animateInputFocus = (field: string, focused: boolean) => {
    Animated.spring(inputAnims[field], {
      toValue: focused ? 1 : 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const fetchProviders = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

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
      showCustomAlert('Error', 'No se pudo cargar los datos del producto.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImagePick = async () => {
    try {
      const hasPermission = await requestImagePermissions();
      if (!hasPermission) {
        showCustomAlert('Permisos', 'Se necesitan permisos para acceder a la galería', 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) {
        return;
      }

      setFormData(prev => ({ ...prev, image_url: result.assets[0].uri }));
    } catch (error: any) {
      showCustomAlert('Error', error.message || 'No se pudo seleccionar la imagen', 'error');
    }
  };

  const handleProviderSelect = (providerId: string) => {
    setFormData(prev => ({ ...prev, provider_id: providerId }));
    setShowProviderModal(false);
  };

  const getProviderName = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : 'Seleccionar proveedor';
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const uniqueCategories = [...new Set(response.data.map((p: any) => p.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryAdd = () => {
    if (newCategoryName.trim()) {
      const category = newCategoryName.trim();
      if (!categories.includes(category)) {
        setCategories([...categories, category].sort());
      }
      setFormData(prev => ({ ...prev, category }));
      setNewCategoryName('');
      setShowCategoryModal(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    setShowCategoryModal(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.sale_price.trim()) {
      newErrors.sale_price = 'El precio de venta es obligatorio';
    } else if (parseFloat(formData.sale_price) <= 0) {
      newErrors.sale_price = 'El precio debe ser mayor a 0';
    }

    if (formData.purchase_price && parseFloat(formData.purchase_price) < 0) {
      newErrors.purchase_price = 'El precio no puede ser negativo';
    }

    if (formData.stock && parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
    }

    if (formData.purchase_price && formData.sale_price) {
      const purchase = parseFloat(formData.purchase_price);
      const sale = parseFloat(formData.sale_price);
      if (sale < purchase) {
        newErrors.sale_price = 'El precio de venta no puede ser menor al de compra';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showCustomAlert('Datos Incompletos', 'Por favor, completa los campos requeridos correctamente.', 'warning');
      return;
    }

    setLoading(true);
    
    try {
      // Si hay una imagen local, subirla a Cloudinary primero
      let finalImageUrl = formData.image_url;
      if (formData.image_url && formData.image_url.startsWith('file://')) {
        setUploadingImage(true);
        try {
          finalImageUrl = await uploadToCloudinary(formData.image_url);
        } catch (error: any) {
          showCustomAlert('Error', 'No se pudo subir la imagen. El producto se guardará sin imagen.', 'warning');
          finalImageUrl = '';
        } finally {
          setUploadingImage(false);
        }
      }

      const productData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        stock: parseInt(formData.stock) || 0,
        provider_id: formData.provider_id || null,
        image_url: finalImageUrl,
      };

      const token = await AsyncStorage.getItem('userToken');
      const url = isEditing ? `${BACKEND_URL}/api/products/${id}` : `${BACKEND_URL}/api/products`;
      const method = isEditing ? 'put' : 'post';

      await axios[method](url, productData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Animación de éxito
      Animated.sequence([
        Animated.spring(successAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        showCustomAlert(
          '¡Éxito! 🎉',
          `Producto ${isEditing ? 'actualizado' : 'creado'} correctamente.`,
          'success',
          [{ text: 'OK', onPress: () => router.replace('/(admin)/products') }]
        );
      }, 300);
    } catch (error: any) {
      showCustomAlert('Error', error.response?.data?.message || 'No se pudo guardar el producto.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    key: keyof typeof formData,
    placeholder: string,
    icon: any,
    keyboardType: any = 'default',
    multiline: boolean = false,
    required: boolean = false
  ) => {
    const isFocused = focusedField === key;
    const hasError = !!errors[key];
    const hasValue = !!formData[key];

    const scale = inputAnims[key].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.02],
    });

    const borderColor = inputAnims[key].interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0.2)', 'rgba(240,147,251,0.6)'],
    });

    return (
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
          <Animated.View
            style={[
              styles.inputContainer,
              {
                borderColor: hasError
                  ? '#ff5858'
                  : borderColor,
                borderWidth: isFocused ? 2 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={
                hasError
                  ? ['rgba(255,88,88,0.15)', 'rgba(255,88,88,0.08)']
                  : isFocused
                  ? ['rgba(240,147,251,0.2)', 'rgba(245,87,108,0.1)']
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inputGradient}
            >
              {/* Icon Container */}
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: hasError
                        ? 'rgba(255,88,88,0.2)'
                        : isFocused
                        ? 'rgba(240,147,251,0.3)'
                        : 'rgba(255,255,255,0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={20}
                    color={
                      hasError ? '#ff5858' : isFocused ? '#f093fb' : 'rgba(255,255,255,0.8)'
                    }
                  />
                </View>
              </View>

              {/* Input Field */}
              <View style={styles.inputFieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>
                    {placeholder}
                    {required && <Text style={styles.requiredStar}> *</Text>}
                  </Text>
                  {hasValue && !hasError && (
                    <Ionicons name="checkmark-circle" size={16} color="#43e97b" />
                  )}
                </View>
                <TextInput
                  style={[styles.input, multiline && styles.multilineInput]}
                  placeholder={getPlaceholderText(key)}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={formData[key]}
                  onChangeText={(text) => handleInputChange(key, text)}
                  onFocus={() => {
                    setFocusedField(key);
                    animateInputFocus(key, true);
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    animateInputFocus(key, false);
                  }}
                  keyboardType={keyboardType}
                  editable={!loading}
                  multiline={multiline}
                  numberOfLines={multiline ? 3 : 1}
                />
              </View>

              {/* Status Indicator */}
              {(hasError || (hasValue && !hasError)) && (
                <View style={styles.statusIndicator}>
                  <Ionicons
                    name={hasError ? 'close-circle' : 'checkmark-circle'}
                    size={20}
                    color={hasError ? '#ff5858' : '#43e97b'}
                  />
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        </BlurView>

        {/* Error Message */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={14} color="#ff5858" />
            <Text style={styles.errorText}>{errors[key]}</Text>
          </View>
        )}

        {/* Helper Text */}
        {!hasError && getHelperText(key) && (
          <View style={styles.helperContainer}>
            <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.helperText}>{getHelperText(key)}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const getPlaceholderText = (key: keyof typeof formData): string => {
    const placeholders: Record<string, string> = {
      name: 'Ej: Coca Cola 600ml',
      code: 'Ej: 7501055320074',
      purchase_price: 'Ej: 12.50',
      sale_price: 'Ej: 15.00',
      stock: 'Ej: 100',
      provider_id: 'Ej: PROV001',
      category: 'Ej: Bebidas',
      image_url: 'Ej: https://ejemplo.com/imagen.jpg',
    };
    return placeholders[key] || '';
  };

  const getHelperText = (key: keyof typeof formData): string | null => {
    const helpers: Record<string, string> = {
      code: 'Código EAN/UPC del producto',
      purchase_price: 'Precio al que compras el producto',
      sale_price: 'Precio al que vendes el producto',
      stock: 'Cantidad disponible en inventario',
      category: 'Categoría para filtros (Bebidas, Abarrotes, etc.)',
    };
    return helpers[key] || null;
  };

  const renderStatCard = (icon: string, label: string, value: string, gradient: [string, string]) => (
    <Animated.View style={[styles.statCard, { opacity: fadeAnim }]}>
      <BlurView intensity={20} tint="dark" style={styles.statBlur}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statGradient}
        >
          <View style={styles.statIcon}>
            <Ionicons name={icon as any} size={24} color="#fff" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );

  const calculateProfit = () => {
    const purchase = parseFloat(formData.purchase_price) || 0;
    const sale = parseFloat(formData.sale_price) || 0;
    const profit = sale - purchase;
    const percentage = purchase > 0 ? ((profit / purchase) * 100).toFixed(1) : '0';
    return { profit: profit.toFixed(2), percentage };
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  if (!formReady) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0f0c29', '#302b63', '#24243e']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  const { profit, percentage } = calculateProfit();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            <Text style={styles.title}>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'Actualiza la información' : 'Completa los datos'}
            </Text>
          </View>

          <View style={styles.headerIconButton}>
            <Ionicons
              name={isEditing ? 'create' : 'add-circle'}
              size={24}
              color="#f093fb"
            />
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Stats Cards - Si está editando y tiene precios */}
          {isEditing && formData.purchase_price && formData.sale_price && (
            <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
              {renderStatCard(
                'cash-outline',
                'Ganancia',
                `$${profit}`,
                ['rgba(67,233,123,0.3)', 'rgba(56,249,215,0.2)']
              )}
              {renderStatCard(
                'trending-up-outline',
                'Margen',
                `${percentage}%`,
                ['rgba(240,147,251,0.3)', 'rgba(245,87,108,0.2)']
              )}
            </Animated.View>
          )}

          {/* Form Container */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Shimmer effect */}
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            />

            {/* Section: Información Básica */}
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color="#f093fb" />
              <Text style={styles.sectionTitle}>Información Básica</Text>
            </View>

            {renderInput('name', 'Nombre del Producto', 'cube', 'default', false, true)}
            {renderInput('code', 'Código de Barras', 'barcode', 'default', false, false)}
            
            {/* Category Selector */}
            <TouchableOpacity
              style={styles.providerSelector}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.8}
            >
              <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
                <View style={styles.inputContainer}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputGradient}
                  >
                    <View style={styles.iconContainer}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="pricetag" size={20} color="rgba(255,255,255,0.8)" />
                      </View>
                    </View>
                    <View style={styles.inputFieldContainer}>
                      <Text style={styles.inputLabel}>Categoría</Text>
                      <Text style={styles.providerText}>{formData.category || 'Seleccionar categoría'}</Text>
                    </View>
                    <View style={styles.statusIndicator}>
                      <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
                    </View>
                  </LinearGradient>
                </View>
              </BlurView>
            </TouchableOpacity>

            {/* Section: Precios */}
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color="#43e97b" />
              <Text style={styles.sectionTitle}>Precios y Stock</Text>
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                {renderInput('purchase_price', 'Precio Compra', 'trending-down', 'numeric')}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput('sale_price', 'Precio Venta', 'trending-up', 'numeric', false, true)}
              </View>
            </View>

            {renderInput('stock', 'Cantidad en Stock', 'file-tray-full', 'numeric')}

            {/* Section: Información Adicional */}
            <View style={styles.sectionHeader}>
              <Ionicons name="options" size={20} color="#4facfe" />
              <Text style={styles.sectionTitle}>Información Adicional</Text>
            </View>

            {/* Provider Selector */}
            <TouchableOpacity
              style={styles.providerSelector}
              onPress={() => setShowProviderModal(true)}
              activeOpacity={0.8}
            >
              <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
                <View style={styles.inputContainer}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputGradient}
                  >
                    <View style={styles.iconContainer}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="business" size={20} color="rgba(255,255,255,0.8)" />
                      </View>
                    </View>
                    <View style={styles.inputFieldContainer}>
                      <Text style={styles.inputLabel}>Proveedor</Text>
                      <Text style={styles.providerText}>{getProviderName(formData.provider_id)}</Text>
                    </View>
                    <View style={styles.statusIndicator}>
                      <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
                    </View>
                  </LinearGradient>
                </View>
              </BlurView>
            </TouchableOpacity>
            
            {/* Image Upload Section */}
            <View style={styles.imageUploadSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="image" size={20} color="#4facfe" />
                <Text style={styles.sectionTitle}>Imagen del Producto</Text>
              </View>
              
              {formData.image_url ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: formData.image_url }} 
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff5858" />
                  </TouchableOpacity>
                </View>
              ) : null}
              
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleImagePick}
                disabled={uploadingImage}
                activeOpacity={0.8}
              >
                <BlurView intensity={20} tint="dark" style={styles.uploadButtonBlur}>
                  <LinearGradient
                    colors={uploadingImage ? ['#ccc', '#999'] : ['#4facfe', '#00f2fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.uploadButtonGradient}
                  >
                    {uploadingImage ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.uploadButtonText}>Subiendo...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="cloud-upload" size={24} color="#fff" />
                        <Text style={styles.uploadButtonText}>
                          {formData.image_url ? 'Cambiar Imagen' : 'Subir Imagen'}
                        </Text>
                        <Ionicons name="arrow-up" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Generate QR Button - Solo si está editando y tiene datos válidos */}
            {isEditing && formData.name && formData.sale_price && (
              <TouchableOpacity
                style={styles.qrButton}
                onPress={() => setShowQR(true)}
                activeOpacity={0.8}
              >
                <BlurView intensity={20} tint="dark" style={styles.qrButtonBlur}>
                  <LinearGradient
                    colors={['#4facfe', '#00f2fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.qrButtonGradient}
                  >
                    <Ionicons name="qr-code" size={24} color="#fff" />
                    <Text style={styles.qrButtonText}>Generar Código QR</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <Animated.View
              style={{
                transform: [{ scale: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                })}],
              }}
            >
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                <BlurView intensity={30} tint="dark" style={styles.submitBlur}>
                  <LinearGradient
                    colors={loading ? ['#ccc', '#999'] : ['#f093fb', '#f5576c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name={isEditing ? 'checkmark-done-circle' : 'add-circle'}
                          size={24}
                          color="#fff"
                        />
                        <Text style={styles.submitText}>
                          {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>

            {/* Info Footer */}
            <View style={styles.infoFooter}>
              <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.infoFooterText}>
                Los campos marcados con * son obligatorios
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>

      {/* QR Generator Modal */}
      <QRGenerator
        visible={showQR}
        product={isEditing ? {
          id: id as string,
          name: formData.name,
          code: formData.code,
          sale_price: parseFloat(formData.sale_price) || 0,
          stock: parseInt(formData.stock) || 0,
          category: formData.category,
        } : null}
        onClose={() => setShowQR(false)}
      />

      {/* Provider Selector Modal */}
      {showProviderModal && (
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="dark" style={styles.modalContainer}>
            <LinearGradient
              colors={['#0f0c29', '#302b63', '#24243e']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Proveedor</Text>
                <TouchableOpacity
                  onPress={() => setShowProviderModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                {providers.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    style={[
                      styles.providerItem,
                      formData.provider_id === provider.id && styles.providerItemSelected,
                    ]}
                    onPress={() => handleProviderSelect(provider.id)}
                  >
                    <LinearGradient
                      colors={
                        formData.provider_id === provider.id
                          ? ['rgba(240,147,251,0.2)', 'rgba(245,87,108,0.1)']
                          : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                      }
                      style={styles.providerItemGradient}
                    >
                      <View style={styles.providerItemIcon}>
                        <Ionicons
                          name="business"
                          size={24}
                          color={formData.provider_id === provider.id ? '#f093fb' : 'rgba(255,255,255,0.7)'}
                        />
                      </View>
                      <View style={styles.providerItemInfo}>
                        <Text
                          style={[
                            styles.providerItemName,
                            formData.provider_id === provider.id && styles.providerItemNameSelected,
                          ]}
                        >
                          {provider.name}
                        </Text>
                        {provider.contact_info && (
                          <Text style={styles.providerItemContact}>{provider.contact_info}</Text>
                        )}
                      </View>
                      {formData.provider_id === provider.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#f093fb" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>
          </BlurView>
        </View>
      )}

      {/* Category Selector Modal */}
      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="dark" style={styles.modalContainer}>
            <LinearGradient
              colors={['#0f0c29', '#302b63', '#24243e']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {/* Add New Category */}
              <View style={styles.addCategoryContainer}>
                <BlurView intensity={20} tint="dark" style={styles.addCategoryBlur}>
                  <View style={styles.addCategoryInput}>
                    <Ionicons name="add-circle" size={24} color="#43e97b" />
                    <TextInput
                      style={styles.addCategoryTextInput}
                      placeholder="Nueva categoría..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      onSubmitEditing={handleCategoryAdd}
                    />
                    <TouchableOpacity
                      style={styles.addCategoryButton}
                      onPress={handleCategoryAdd}
                      disabled={!newCategoryName.trim()}
                    >
                      <LinearGradient
                        colors={newCategoryName.trim() ? ['#43e97b', '#38f9d7'] : ['#ccc', '#999']}
                        style={styles.addCategoryButtonGradient}
                      >
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </View>

              <ScrollView style={styles.modalContent}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.providerItem,
                      formData.category === category && styles.providerItemSelected,
                    ]}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <LinearGradient
                      colors={
                        formData.category === category
                          ? ['rgba(240,147,251,0.2)', 'rgba(245,87,108,0.1)']
                          : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                      }
                      style={styles.providerItemGradient}
                    >
                      <View style={styles.providerItemIcon}>
                        <Ionicons
                          name="pricetag"
                          size={24}
                          color={formData.category === category ? '#f093fb' : 'rgba(255,255,255,0.7)'}
                        />
                      </View>
                      <View style={styles.providerItemInfo}>
                        <Text
                          style={[
                            styles.providerItemName,
                            formData.category === category && styles.providerItemNameSelected,
                          ]}
                        >
                          {category}
                        </Text>
                      </View>
                      {formData.category === category && (
                        <Ionicons name="checkmark-circle" size={24} color="#f093fb" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>
          </BlurView>
        </View>
      )}
Alert.alert
      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        buttons={alertData.buttons}
        onDismiss={() => setAlertVisible(false)}
      />
    </KeyboardAvoidingView>
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
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(240,147,251,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240,147,251,0.3)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
  },
  statBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  formContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    transform: [{ skewX: '-20deg' }],
    zIndex: 1,
    pointerEvents: 'none',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputBlur: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  inputContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    minHeight: 70,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputFieldContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  requiredStar: {
    color: '#ff5858',
    fontSize: 14,
  },
  input: {
    fontSize: 15,
    color: '#fff',
    padding: 0,
    minHeight: 24,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  statusIndicator: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginLeft: 58,
  },
  errorText: {
    fontSize: 12,
    color: '#ff5858',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginLeft: 58,
  },
  helperText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(240,147,251,0.5)',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitBlur: {
    overflow: 'hidden',
    borderRadius: 18,
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoFooterText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  qrButton: {
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(79,172,254,0.5)',
  },
  qrButtonBlur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  qrButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageUploadSection: {
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(79,172,254,0.5)',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 4,
  },
  uploadButton: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(79,172,254,0.5)',
  },
  uploadButtonBlur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  providerSelector: {
    marginBottom: 16,
  },
  providerText: {
    fontSize: 15,
    color: '#fff',
    marginTop: 6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    margin: 20,
    marginTop: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  providerItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  providerItemSelected: {
    borderColor: 'rgba(240,147,251,0.5)',
  },
  providerItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  providerItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerItemInfo: {
    flex: 1,
  },
  providerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  providerItemNameSelected: {
    color: '#fff',
  },
  providerItemContact: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  addCategoryContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  addCategoryBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(67,233,123,0.3)',
  },
  addCategoryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  addCategoryTextInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  addCategoryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  addCategoryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});