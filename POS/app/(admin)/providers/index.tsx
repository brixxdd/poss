import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
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
import { useAlert, alertHelpers } from '../../components/AlertProvider';

const { width } = Dimensions.get('window');

export default function ManageProviderScreen() {
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  const { showAlert } = useAlert();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const cancelShake = useRef(new Animated.Value(0)).current;
  const inputAnims = useRef<Record<string, Animated.Value>>({
    name: new Animated.Value(0),
    contact_info: new Animated.Value(0),
    email: new Animated.Value(0),
    phone: new Animated.Value(0),
    address: new Animated.Value(0),
    notes: new Animated.Value(0),
  }).current;

  useEffect(() => {
    if (id) {
      fetchProvider(id as string);
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
    // Shimmer continuo
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

  const fetchProvider = async (providerId: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/providers/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const provider = response.data;
      setFormData({
        name: provider.name || '',
        contact_info: provider.contact_info || '',
        email: provider.email || '',
        phone: provider.phone || '',
        address: provider.address || '',
        notes: provider.notes || '',
      });
      setFormReady(true);
    } catch (error: any) {
      alertHelpers.error(
        showAlert,
        'Error',
        error.response?.data?.message || 'No se pudo cargar los datos del proveedor.'
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error al escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phone.length >= 10 && phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proveedor es obligatorio';
    }

    if (!formData.contact_info.trim() && !formData.email.trim() && !formData.phone.trim()) {
      newErrors.contact_info = 'Proporciona al menos un medio de contacto';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Teléfono no válido (mínimo 10 dígitos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alertHelpers.warning(
        showAlert,
        'Datos Incompletos',
        'Por favor, completa los campos requeridos correctamente.'
      );
      return;
    }

    setLoading(true);

    // Consolidar contact_info si está vacío
    let contactInfo = formData.contact_info;
    if (!contactInfo && (formData.email || formData.phone)) {
      contactInfo = [formData.email, formData.phone].filter(Boolean).join(' | ');
    }

    const providerData = {
      name: formData.name,
      contact_info: contactInfo,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      notes: formData.notes || null,
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = isEditing
        ? `${BACKEND_URL}/api/providers/${id}`
        : `${BACKEND_URL}/api/providers`;
      const method = isEditing ? 'put' : 'post';

      await axios[method](url, providerData, {
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
        alertHelpers.success(
          showAlert,
          '¡Éxito! 🎉',
          `Proveedor ${isEditing ? 'actualizado' : 'creado'} correctamente.`,
          () => router.replace('/(admin)/providers')
        );
      }, 300);
    } catch (error: any) {
      alertHelpers.error(
        showAlert,
        'Error',
        error.response?.data?.message || 'No se pudo guardar el proveedor.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Animación de shake
    Animated.sequence([
      Animated.timing(cancelShake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(cancelShake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(cancelShake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(cancelShake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start(() => {
      router.back();
    });
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
      outputRange: ['rgba(255,255,255,0.2)', 'rgba(67,233,123,0.6)'],
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
                borderColor: hasError ? '#ff5858' : borderColor,
                borderWidth: isFocused ? 2 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={
                hasError
                  ? ['rgba(255,88,88,0.15)', 'rgba(255,88,88,0.08)']
                  : isFocused
                  ? ['rgba(67,233,123,0.2)', 'rgba(56,249,215,0.1)']
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inputGradient}
            >
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: hasError
                        ? 'rgba(255,88,88,0.2)'
                        : isFocused
                        ? 'rgba(67,233,123,0.3)'
                        : 'rgba(255,255,255,0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={20}
                    color={hasError ? '#ff5858' : isFocused ? '#43e97b' : 'rgba(255,255,255,0.8)'}
                  />
                </View>
              </View>

              {/* Input */}
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

              {/* Status */}
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

        {/* Error */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={14} color="#ff5858" />
            <Text style={styles.errorText}>{errors[key]}</Text>
          </View>
        )}

        {/* Helper */}
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
      name: 'Ej: Distribuidora Los Alpes',
      contact_info: 'Ej: contacto@empresa.com | 961-123-4567',
      email: 'Ej: ventas@distribuidora.com',
      phone: 'Ej: 961-123-4567',
      address: 'Ej: Av. Central #123, Col. Centro, Tapachula',
      notes: 'Ej: Horario: Lunes a Viernes 9am-6pm',
    };
    return placeholders[key] || '';
  };

  const getHelperText = (key: keyof typeof formData): string | null => {
    const helpers: Record<string, string> = {
      contact_info: 'Email o teléfono principal del proveedor',
      email: 'Correo electrónico para comunicación oficial',
      phone: 'Número telefónico con lada (10 dígitos mínimo)',
      address: 'Dirección física del proveedor',
      notes: 'Información adicional relevante (horarios, condiciones, etc.)',
    };
    return helpers[key] || null;
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
        <ActivityIndicator size="large" color="#43e97b" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>
              {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'Actualiza la información' : 'Registra un nuevo proveedor'}
            </Text>
          </View>

          <View style={styles.headerIconButton}>
            <Ionicons name="business" size={24} color="#43e97b" />
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Shimmer */}
            <Animated.View
              style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]}
            />

            {/* Info Card */}
            <Animated.View style={[styles.infoCard, { opacity: fadeAnim }]}>
              <BlurView intensity={20} tint="dark" style={styles.infoBlur}>
                <LinearGradient
                  colors={['rgba(67,233,123,0.2)', 'rgba(56,249,215,0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.infoGradient}
                >
                  <Ionicons name="information-circle" size={24} color="#43e97b" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>Gestión de Proveedores</Text>
                    <Text style={styles.infoText}>
                      {isEditing
                        ? 'Actualiza la información de contacto y detalles del proveedor'
                        : 'Registra los datos de contacto para futuras órdenes y seguimiento'}
                    </Text>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>

            {/* Sección: Información Básica */}
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#43e97b" />
              <Text style={styles.sectionTitle}>Información Básica</Text>
            </View>

            {renderInput('name', 'Nombre del Proveedor', 'business', 'default', false, true)}
            {renderInput('contact_info', 'Información de Contacto', 'at', 'default', false, true)}

            {/* Sección: Datos de Contacto */}
            <View style={styles.sectionHeader}>
              <Ionicons name="call" size={20} color="#4facfe" />
              <Text style={styles.sectionTitle}>Datos de Contacto</Text>
            </View>

            {renderInput('email', 'Correo Electrónico', 'mail', 'email-address')}
            {renderInput('phone', 'Teléfono', 'call', 'phone-pad')}

            {/* Sección: Información Adicional */}
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color="#f093fb" />
              <Text style={styles.sectionTitle}>Información Adicional</Text>
            </View>

            {renderInput('address', 'Dirección', 'location', 'default', true)}
            {renderInput('notes', 'Notas', 'document-text', 'default', true)}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {/* Submit */}
              <Animated.View
                style={[
                  styles.submitButtonWrapper,
                  {
                    transform: [
                      {
                        scale: successAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.05],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <BlurView intensity={30} tint="dark" style={styles.submitBlur}>
                    <LinearGradient
                      colors={loading ? ['#ccc', '#999'] : ['#43e97b', '#38f9d7']}
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
                            {isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor'}
                          </Text>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </BlurView>
                </TouchableOpacity>
              </Animated.View>

              {/* Cancel */}
              <Animated.View
                style={{
                  transform: [{ translateX: cancelShake }],
                }}
              >
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={20} tint="dark" style={styles.cancelBlur}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cancelGradient}
                    >
                      <Ionicons name="close-circle-outline" size={22} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </LinearGradient>
                  </BlurView>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Footer */}
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
    backgroundColor: 'rgba(67,233,123,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(67,233,123,0.3)',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  infoCard: {
    marginBottom: 24,
  },
  infoBlur: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(67,233,123,0.3)',
  },
  infoGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
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
  buttonsContainer: {
    marginTop: 24,
    gap: 12,
  },
  submitButtonWrapper: {
    width: '100%',
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(67,233,123,0.5)',
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
  cancelButton: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelBlur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  cancelGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
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