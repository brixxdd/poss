import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../CustomAlert';

const { width } = Dimensions.get('window');

interface TopProduct {
  product_id: string;
  product_name: string;
  total_qty_sold: number;
}

interface TopProductsListProps {
  rangeDays?: number;
  limit?: number;
}

const MEDAL_COLORS = {
  1: ['#FFD700', '#FFA500'], // Gold
  2: ['#C0C0C0', '#808080'], // Silver
  3: ['#CD7F32', '#8B4513'], // Bronze
};

const RANK_EMOJIS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export default function TopProductsList({ rangeDays = 30, limit = 5 }: TopProductsListProps) {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    type: 'error' as 'info' | 'success' | 'warning' | 'error',
    buttons: [{ text: 'OK' }],
  });
  const [maxQty, setMaxQty] = useState(0);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer continuo
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();

    // Pulse continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

  const fetchTopProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(
        `${BACKEND_URL}/api/analytics/top-products?range=${rangeDays}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );
      const products = response.data;
      setTopProducts(products);

      // Calcular máximo para progress bars
      if (products.length > 0) {
        const max = Math.max(...products.map((p: TopProduct) => p.total_qty_sold));
        setMaxQty(max);
      }

      // Iniciar animaciones
      startAnimations();
    } catch (err: any) {
      console.error('Error al obtener productos principales:', err.response?.data || err.message);
      setAlertData({
        title: 'Error',
        message: 'Fallo al obtener productos principales.',
        type: 'error',
        buttons: [{ text: 'OK' }],
      });
      setAlertVisible(true);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [rangeDays, limit]);

  useEffect(() => {
    fetchTopProducts();
  }, [fetchTopProducts]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRefresh = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    fetchTopProducts();
  };

  const renderPodium = () => {
    if (topProducts.length < 3) return null;

    const top3 = topProducts.slice(0, 3);
    // Reordenar: 2do, 1ro, 3ro para efecto podium
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const heights = [120, 150, 100]; // Alturas del podium

    return (
      <Animated.View
        style={[
          styles.podiumContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {podiumOrder.map((product, idx) => {
          const actualRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
          return renderPodiumSpot(product, actualRank, heights[idx], idx);
        })}
      </Animated.View>
    );
  };

  const renderPodiumSpot = (
    product: TopProduct,
    rank: number,
    height: number,
    index: number
  ) => {
    const isFirst = rank === 1;
    const colors = MEDAL_COLORS[rank as keyof typeof MEDAL_COLORS] || ['#888', '#666'];

    return (
      <Animated.View
        key={product.product_id}
        style={[
          styles.podiumSpot,
          {
            height,
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 50],
                }),
              },
            ],
          },
        ]}
      >
        {/* Confetti para el primero */}
        {isFirst && (
          <Animated.View
            style={[
              styles.confettiContainer,
              {
                opacity: confettiAnim,
                transform: [
                  {
                    scale: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.confetti}>🎉</Text>
            <Text style={styles.confetti}>✨</Text>
            <Text style={styles.confetti}>🎊</Text>
          </Animated.View>
        )}

        {/* Medal */}
        <Animated.View
          style={[
            styles.medalContainer,
            {
              transform: [{ scale: isFirst ? pulseAnim : 1 }],
            },
          ]}
        >
          <LinearGradient colors={colors as [string, string]} style={styles.medal}>
            <Text style={styles.medalEmoji}>{RANK_EMOJIS[rank as keyof typeof RANK_EMOJIS]}</Text>
            <Text style={styles.medalRank}>#{rank}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Product Info */}
        <View style={styles.podiumInfo}>
          <Text style={styles.podiumName} numberOfLines={2}>
            {product.product_name}
          </Text>
          <View style={styles.podiumQtyContainer}>
            <Ionicons name="trending-up" size={14} color={colors[0]} />
            <Text style={[styles.podiumQty, { color: colors[0] }]}>
              {product.total_qty_sold}
            </Text>
          </View>
        </View>

        {/* Podium Base */}
        <View style={styles.podiumBase}>
          <LinearGradient
            colors={[colors[0], colors[1], `${colors[1]}80`] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.podiumBaseGradient}
          >
            <Text style={styles.podiumBaseText}>TOP {rank}</Text>
          </LinearGradient>
        </View>
      </Animated.View>
    );
  };

  const renderProductItem = ({ item, index }: { item: TopProduct; index: number }) => {
    // Skip top 3 (ya están en el podium)
    if (index < 3 && topProducts.length >= 3) return null;

    const itemAnim = new Animated.Value(0);
    const progressAnim = new Animated.Value(0);

    // Stagger animation
    Animated.spring(itemAnim, {
      toValue: 1,
      delay: index * 100,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: maxQty > 0 ? item.total_qty_sold / maxQty : 0,
      delay: index * 100 + 300,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    const percentage = maxQty > 0 ? ((item.total_qty_sold / maxQty) * 100).toFixed(0) : 0;
    const gradientColors = index % 2 === 0
      ? ['rgba(79,172,254,0.3)', 'rgba(0,242,254,0.2)']
      : ['rgba(67,233,123,0.3)', 'rgba(56,249,215,0.2)'];

    return (
      <Animated.View
        style={[
          styles.itemWrapper,
          {
            opacity: itemAnim,
            transform: [
              {
                translateX: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
              {
                scale: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9}>
          <BlurView intensity={30} tint="dark" style={styles.itemBlur}>
            <LinearGradient
              colors={gradientColors as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.itemContainer}
            >
              {/* Rank Badge */}
              <View style={styles.rankBadge}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
                  style={styles.rankBadgeGradient}
                >
                  <Text style={styles.itemRank}>#{index + 1}</Text>
                </LinearGradient>
              </View>

              {/* Product Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product_name}
                </Text>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#43e97b', '#38f9d7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.progressGradient}
                      />
                    </Animated.View>
                  </View>
                  <Text style={styles.progressPercentage}>{percentage}%</Text>
                </View>

                {/* Quantity */}
                <View style={styles.qtyRow}>
                  <Ionicons name="cube" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.itemQty}>{item.total_qty_sold} vendidos</Text>
                </View>
              </View>

              {/* Star Icon */}
              <View style={styles.starContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.starGradient}
                >
                  <Ionicons name="star" size={18} color="#fff" />
                </LinearGradient>
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#f093fb" />
          <Text style={styles.loadingText}>Cargando productos top...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color="#ff5858" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.retryGradient}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryText}>Reintentar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (topProducts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="cube-outline" size={48} color="rgba(255,255,255,0.5)" />
          <Text style={styles.noDataText}>
            No hay datos de ventas en los últimos {rangeDays} días
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Shimmer Effect */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.headerIcon}
          >
            <Ionicons name="trophy" size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Productos Top</Text>
            <Text style={styles.subtitle}>Últimos {rangeDays} días</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.refreshGradient}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Podium (Top 3) */}
      {topProducts.length >= 3 && renderPodium()}

      {/* List (Resto de productos) */}
      {topProducts.length > 3 && (
        <View style={styles.listContainer}>
          <FlatList
            data={topProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.product_id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* Footer Stats */}
      <View style={styles.footer}>
        <BlurView intensity={20} tint="dark" style={styles.footerBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            style={styles.footerGradient}
          >
            <Ionicons name="stats-chart" size={16} color="#43e97b" />
            <Text style={styles.footerText}>
              Total: {topProducts.reduce((sum, p) => sum + p.total_qty_sold, 0)} unidades
            </Text>
          </LinearGradient>
        </BlurView>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        buttons={alertData.buttons}
        onDismiss={() => setAlertVisible(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ skewX: '-20deg' }],
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextContainer: {
    gap: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  refreshGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    gap: 12,
  },
  podiumSpot: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    top: -30,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  confetti: {
    fontSize: 20,
  },
  medalContainer: {
    marginBottom: 8,
    zIndex: 5,
  },
  medal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  medalEmoji: {
    fontSize: 28,
  },
  medalRank: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  podiumInfo: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  podiumQty: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  podiumBase: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  podiumBaseGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  podiumBaseText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    gap: 12,
    marginTop: 20,
  },
  listContent: {
    gap: 12,
  },
  itemWrapper: {
    marginBottom: 0,
  },
  itemBlur: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  rankBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemInfo: {
    flex: 1,
    gap: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  progressPercentage: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#43e97b',
    minWidth: 35,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemQty: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  starContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  starGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 16,
  },
  footerBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  footerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  errorText: {
    color: '#ff5858',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
});