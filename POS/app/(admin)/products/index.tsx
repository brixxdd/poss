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
      Alert.alert('Error', 'No se pudo cargar los datos del producto.');
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
      Alert.alert('Datos Incompletos', 'Por favor, completa los campos requeridos correctamente.');
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
        Alert.alert(
          '¡Éxito! 🎉',
          `Producto ${isEditing ? 'actualizado' : 'creado'} correctamente.`,
          [{ text: 'OK', onPress: () => router.replace('/(admin)/products') }]
        );
      }, 300);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar el producto.');
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

  const renderStatCard = (icon: string, label: string, value: string, gradient: string[]) => (
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
            {renderInput('category', 'Categoría', 'pricetag', 'default', false, false)}

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

            {renderInput('provider_id', 'ID del Proveedor', 'business', 'default')}
            {renderInput('image_url', 'URL de la Imagen', 'image', 'url', true)}

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
});