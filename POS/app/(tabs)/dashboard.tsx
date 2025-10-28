import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/app/constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    todaySales: 0,
    todayRevenue: 0,
    activeProducts: 0,
    avgTicket: 0,
    topProducts: [],
  });
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchStats();
    startAnimations();
  }, []);

  useEffect(() => {
    // Pulse animation para métricas
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
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

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Simular estadísticas (puedes conectar con tu API real)
      setTimeout(() => {
        setStats({
          todaySales: 127,
          todayRevenue: 8450.50,
          activeProducts: 342,
          avgTicket: 66.54,
          topProducts: [
            { name: 'Refresco Cola', sales: 45, revenue: 675 },
            { name: 'Chicles', sales: 38, revenue: 190 },
            { name: 'Galletas', sales: 32, revenue: 480 },
            { name: 'Agua', sales: 28, revenue: 280 },
          ],
        });
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const renderStatCard = (icon: string, label: string, value: string, color: string, gradientColors: string[]) => {
    return (
      <Animated.View
        style={[
          styles.statCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.statCardBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardGradient}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
              <LinearGradient
                colors={gradientColors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statIconGradient}
              >
                <Ionicons name={icon as any} size={24} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
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
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Métricas en Tiempo Real</Text>
          </View>
          
          <View style={styles.backButton} />
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'cart',
            'Ventas Hoy',
            stats.todaySales.toString(),
            '#4facfe',
            ['#4facfe', '#00f2fe']
          )}
          {renderStatCard(
            'cash',
            'Ingresos Hoy',
            `$${stats.todayRevenue.toFixed(2)}`,
            '#43e97b',
            ['#43e97b', '#38f9d7']
          )}
          {renderStatCard(
            'cube',
            'Productos Activos',
            stats.activeProducts.toString(),
            '#f093fb',
            ['#f093fb', '#f5576c']
          )}
          {renderStatCard(
            'receipt',
            'Ticket Promedio',
            `$${stats.avgTicket.toFixed(2)}`,
            '#fa709a',
            ['#fa709a', '#fee140']
          )}
        </View>

        {/* Top Products Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.sectionIconContainer}
              >
                <Ionicons name="trophy" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Productos Top</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsList}>
            {stats.topProducts.map((product: any, index: number) => (
              <Animated.View
                key={index}
                style={[
                  styles.productCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: pulseAnim }
                    ],
                  },
                ]}
              >
                <BlurView intensity={20} tint="dark" style={styles.productCardBlur}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.productCardGradient}
                  >
                    <View style={styles.productRank}>
                      <Text style={styles.productRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productSales}>{product.sales} ventas</Text>
                    </View>
                    <View style={styles.productRevenue}>
                      <Text style={styles.productRevenueText}>${product.revenue}</Text>
                    </View>
                  </LinearGradient>
                </BlurView>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.quickActions,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/sales')}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickActionGradient}
            >
              <Ionicons name="cart" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Nueva Venta</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/inventory')}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickActionGradient}
            >
              <Ionicons name="qr-code" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Escanear QR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0c29',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    marginBottom: 12,
  },
  statCardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllText: {
    color: '#f093fb',
    fontSize: 14,
    fontWeight: '600',
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    marginBottom: 12,
  },
  productCardBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  productCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  productRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(240,147,251,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f093fb',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  productSales: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  productRevenue: {
    backgroundColor: 'rgba(67,233,123,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  productRevenueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#43e97b',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quickActionGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
