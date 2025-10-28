import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/app/constants/config';
import { useAlert, alertHelpers } from '../components/AlertProvider';

export default function ReturnsScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<'new' | 'pending'>('new');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedBottles, setSelectedBottles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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
    ]).start();
  };

  const bottleTypes = [
    { id: 'coca-600', name: 'Coca-Cola 600ml', price: 5 },
    { id: 'coca-2L', name: 'Coca-Cola 2L', price: 10 },
    { id: 'cerveza-carton', name: 'Cerveza Cartón', price: 15 },
    { id: 'cerveza-litrona', name: 'Cerveza Litrona', price: 12 },
    { id: 'agua-gal', name: 'Garrafón', price: 20 },
  ];

  const handleAddBottle = (bottle: any) => {
    const existing = selectedBottles.find(b => b.id === bottle.id);
    if (existing) {
      setSelectedBottles(selectedBottles.map(b => 
        b.id === bottle.id ? { ...b, quantity: b.quantity + 1 } : b
      ));
    } else {
      setSelectedBottles([...selectedBottles, { ...bottle, quantity: 1 }]);
    }
  };

  const handleRemoveBottle = (id: string) => {
    const item = selectedBottles.find(b => b.id === id);
    if (item && item.quantity > 1) {
      setSelectedBottles(selectedBottles.map(b => 
        b.id === id ? { ...b, quantity: b.quantity - 1 } : b
      ));
    } else {
      setSelectedBottles(selectedBottles.filter(b => b.id !== id));
    }
  };

  const calculateTotal = selectedBottles.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleProcessReturn = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alertHelpers.warning(showAlert, 'Información Faltante', 'Nombre y teléfono son obligatorios');
      return;
    }

    if (selectedBottles.length === 0 && !depositAmount) {
      alertHelpers.warning(showAlert, 'Nada que Procesar', 'Agrega envases o depósito');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Crear registro de retorno/envase
      const returnData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        bottles: selectedBottles,
        deposit: parseFloat(depositAmount) || 0,
        status: 'pending', // pending, returned, paid
      };

      const response = await axios.post(`${BACKEND_URL}/api/returns`, returnData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alertHelpers.success(showAlert, '✅ Registrado', 
        `Cliente: ${customerName}\nTeléfono: ${customerPhone}\nRecordatorio configurado`, 
        () => {
          // Reset form
          setCustomerName('');
          setCustomerPhone('');
          setDepositAmount('');
          setSelectedBottles([]);
          setActiveTab('pending');
        }
      );

    } catch (error: any) {
      console.error('Error:', error);
      alertHelpers.error(showAlert, 'Error', error.response?.data?.message || 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  };

  const renderNewReturn = () => (
    <ScrollView style={styles.content}>
      {/* Customer Info */}
      <Animated.View 
        style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <Text style={styles.sectionTitle}>📋 Datos del Cliente</Text>
        
        <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            style={styles.inputGradient}
          >
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Nombre del cliente"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>
          </LinearGradient>
        </BlurView>

        <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            style={styles.inputGradient}
          >
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Teléfono (WhatsApp)"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Bottle Types */}
      <Animated.View 
        style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <Text style={styles.sectionTitle}>🍾 Tipos de Envases</Text>
        <View style={styles.bottleGrid}>
          {bottleTypes.map(bottle => (
            <TouchableOpacity
              key={bottle.id}
              onPress={() => handleAddBottle(bottle)}
              style={styles.bottleCard}
              activeOpacity={0.8}
            >
              <BlurView intensity={20} tint="dark" style={styles.bottleBlur}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
                  style={styles.bottleGradient}
                >
                  <Ionicons name="wine-outline" size={30} color="#f093fb" />
                  <Text style={styles.bottleName}>{bottle.name}</Text>
                  <Text style={styles.bottlePrice}>${bottle.price}</Text>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Selected Bottles */}
      {selectedBottles.length > 0 && (
        <Animated.View 
          style={[styles.section, { opacity: fadeAnim }]}
        >
          <Text style={styles.sectionTitle}>📦 Envases Seleccionados</Text>
          {selectedBottles.map(item => (
            <BlurView key={item.id} intensity={20} tint="dark" style={styles.selectedItemBlur}>
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
                style={styles.selectedItemGradient}
              >
                <View style={styles.selectedItemInfo}>
                  <Text style={styles.selectedItemName}>{item.name}</Text>
                  <Text style={styles.selectedItemSubtext}>${item.price} c/u</Text>
                </View>
                
                <View style={styles.quantityControls}>
                  <TouchableOpacity onPress={() => handleRemoveBottle(item.id)}>
                    <View style={styles.qtyButton}>
                      <Ionicons name="remove" size={20} color="#ff5858" />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => handleAddBottle(item)}>
                    <View style={styles.qtyButton}>
                      <Ionicons name="add" size={20} color="#43e97b" />
                    </View>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          ))}
        </Animated.View>
      )}

      {/* Deposit */}
      <Animated.View 
        style={[styles.section, { opacity: fadeAnim }]}
      >
        <Text style={styles.sectionTitle}>💰 Depósito Adicional (opcional)</Text>
        <BlurView intensity={20} tint="dark" style={styles.inputBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            style={styles.inputGradient}
          >
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.input}
                placeholder="Monto en efectivo"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={depositAmount}
                onChangeText={setDepositAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Total */}
      <Animated.View 
        style={[styles.section, { opacity: fadeAnim }]}
      >
        <BlurView intensity={20} tint="dark" style={styles.totalBlur}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.totalGradient}
          >
            <Text style={styles.totalLabel}>Total a Devolver:</Text>
            <Text style={styles.totalAmount}>${calculateTotal + parseFloat(depositAmount || '0')}</Text>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </ScrollView>
  );

  const renderPending = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={60} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyText}>No hay devoluciones pendientes</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <Animated.View 
        style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Envases & Devoluciones</Text>
          <Text style={styles.headerSubtitle}>Control de depósitos</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab('new')}
          style={[styles.tab, activeTab === 'new' && styles.tabActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            Nuevo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('pending')}
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pendientes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'new' ? renderNewReturn() : renderPending()}

      {/* Process Button */}
      {activeTab === 'new' && (selectedBottles.length > 0 || depositAmount) && (
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            onPress={handleProcessReturn}
            disabled={loading}
            style={styles.processButton}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={loading ? ['#ccc', '#999'] : ['#43e97b', '#38f9d7']}
              style={styles.processGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.processText}>Registrar Devolución</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0f0c29' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
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
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  headerSpacer: { width: 44 },
  
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(240,147,251,0.3)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#f093fb',
  },
  
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  
  inputBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  inputGradient: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  
  bottleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bottleCard: {
    width: '47%',
  },
  bottleBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  bottleGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  bottleName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  bottlePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#43e97b',
  },
  
  selectedItemBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  selectedItemGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  selectedItemSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 24,
    textAlign: 'center',
  },
  
  totalBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  totalGradient: {
    padding: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 12,
  },
  
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  processButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  processGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  processText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
