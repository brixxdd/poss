import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface SalesSummary {
  totalToday: number;
  avgDaily: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export default function SalesSummaryCards() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim1 = useRef(new Animated.Value(0.8)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const trendAnim = useRef(new Animated.Value(0)).current;
  const valueCounterAnim1 = useRef(new Animated.Value(0)).current;
  const valueCounterAnim2 = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Refs para animated values de contador
  const [displayTotalToday, setDisplayTotalToday] = useState(0);
  const [displayAvgDaily, setDisplayAvgDaily] = useState(0);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      const totalTodayRes = await axios.get(`${BACKEND_URL}/api/analytics/total-sales-today`, { headers });
      const avgDailyRes = await axios.get(`${BACKEND_URL}/api/analytics/avg-daily-sales`, { headers });

      const newSummary = {
        totalToday: totalTodayRes.data.total_sales || 0,
        avgDaily: avgDailyRes.data.average_daily_sales || 0,
        trend: avgDailyRes.data.trend || 'stable',
        trendPercentage: avgDailyRes.data.trend_percentage || 0,
      };

      setSummary(newSummary);
      
      // Animar contadores
      animateCounters(newSummary);
      
      // Iniciar animaciones de entrada
      startAnimations();
    } catch (err) {
      console.error('Error fetching sales summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    
    // Shimmer continuo
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse continuo para trend
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
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
      Animated.spring(scaleAnim1, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim2, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(trendAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateCounters = (data: SalesSummary) => {
    // Resetear y animar contador 1
    valueCounterAnim1.setValue(0);
    Animated.timing(valueCounterAnim1, {
      toValue: data.totalToday,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Listener para actualizar display
    valueCounterAnim1.addListener(({ value }) => {
      setDisplayTotalToday(value);
    });

    // Resetear y animar contador 2
    valueCounterAnim2.setValue(0);
    Animated.timing(valueCounterAnim2, {
      toValue: data.avgDaily,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    valueCounterAnim2.addListener(({ value }) => {
      setDisplayAvgDaily(value);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Animación de refresh
    Animated.sequence([
      Animated.timing(scaleAnim1, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim1, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    await fetchSummary();
    setRefreshing(false);
  };

  const getTrendConfig = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return {
          icon: 'trending-up' as const,
          color: '#43e97b',
          gradient: ['rgba(67,233,123,0.3)', 'rgba(56,249,215,0.2)'],
          label: 'Subiendo',
          emoji: '📈',
        };
      case 'down':
        return {
          icon: 'trending-down' as const,
          color: '#ff5858',
          gradient: ['rgba(255,88,88,0.3)', 'rgba(255,88,88,0.2)'],
          label: 'Bajando',
          emoji: '📉',
        };
      case 'stable':
        return {
          icon: 'remove-outline' as const,
          color: '#ffae42',
          gradient: ['rgba(255,174,66,0.3)', 'rgba(255,174,66,0.2)'],
          label: 'Estable',
          emoji: '➡️',
        };
    }
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const trendRotate = trendAnim.interpolate({
    inputRange: [0, 1],
    outputRange: summary?.trend === 'up' ? ['-45deg', '0deg'] : summary?.trend === 'down' ? ['45deg', '0deg'] : ['0deg', '0deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (loading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  const trendConfig = getTrendConfig(summary?.trend || 'stable');

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

      {/* Card 1: Ventas de Hoy */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ scale: scaleAnim1 }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
            <LinearGradient
              colors={['rgba(67,233,123,0.25)', 'rgba(56,249,215,0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Shimmer interno */}
              <Animated.View
                style={[
                  styles.cardShimmer,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              />

              {/* Icon con glow */}
              <View style={styles.iconContainer}>
                <Animated.View
                  style={[
                    styles.iconGlow,
                    {
                      opacity: glowOpacity,
                      backgroundColor: '#43e97b',
                    },
                  ]}
                />
                <View style={styles.iconCircle}>
                  <LinearGradient
                    colors={['#43e97b', '#38f9d7']}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="cash" size={28} color="#fff" />
                  </LinearGradient>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.cardTitle}>💰 Ventas de Hoy</Text>

              {/* Value con contador animado */}
              <View style={styles.valueContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <Text style={styles.cardValue}>
                  {displayTotalToday.toFixed(2)}
                </Text>
              </View>

              {/* Badge */}
              <View style={styles.badge}>
                <LinearGradient
                  colors={['rgba(67,233,123,0.4)', 'rgba(56,249,215,0.3)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.badgeGradient}
                >
                  <Ionicons name="today" size={12} color="#fff" />
                  <Text style={styles.badgeText}>Hoy</Text>
                </LinearGradient>
              </View>

              {/* Refresh indicator */}
              {refreshing && (
                <View style={styles.refreshIndicator}>
                  <ActivityIndicator size="small" color="#43e97b" />
                </View>
              )}
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

      {/* Card 2: Promedio Diario con Trend */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ scale: scaleAnim2 }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
            <LinearGradient
              colors={trendConfig.gradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Shimmer interno */}
              <Animated.View
                style={[
                  styles.cardShimmer,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              />

              {/* Header con icons */}
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Animated.View
                    style={[
                      styles.iconGlow,
                      {
                        opacity: glowOpacity,
                        backgroundColor: '#4facfe',
                      },
                    ]}
                  />
                  <View style={styles.iconCircle}>
                    <LinearGradient
                      colors={['#4facfe', '#00f2fe']}
                      style={styles.iconGradient}
                    >
                      <Ionicons name="stats-chart" size={28} color="#fff" />
                    </LinearGradient>
                  </View>
                </View>

                {/* Trend Icon animado */}
                <Animated.View
                  style={{
                    transform: [{ scale: pulseAnim }, { rotate: trendRotate }],
                  }}
                >
                  <View
                    style={[
                      styles.trendBadge,
                      { backgroundColor: `${trendConfig.color}30` },
                    ]}
                  >
                    <Ionicons
                      name={trendConfig.icon}
                      size={24}
                      color={trendConfig.color}
                    />
                  </View>
                </Animated.View>
              </View>

              {/* Title */}
              <Text style={styles.cardTitle}>📊 Promedio Diario</Text>

              {/* Value con contador animado */}
              <View style={styles.valueContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <Text style={styles.cardValue}>
                  {displayAvgDaily.toFixed(2)}
                </Text>
              </View>

              {/* Trend Info */}
              <Animated.View
                style={[
                  styles.trendContainer,
                  {
                    opacity: trendAnim,
                    transform: [
                      {
                        translateY: trendAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    styles.trendPill,
                    { backgroundColor: `${trendConfig.color}20` },
                  ]}
                >
                  <Text style={styles.trendEmoji}>{trendConfig.emoji}</Text>
                  <Text style={[styles.trendLabel, { color: trendConfig.color }]}>
                    {trendConfig.label}
                  </Text>
                  {summary?.trend !== 'stable' && (
                    <Text
                      style={[styles.trendPercentage, { color: trendConfig.color }]}
                    >
                      {summary?.trend === 'up' ? '+' : ''}
                      {summary?.trendPercentage.toFixed(1)}%
                    </Text>
                  )}
                </View>
              </Animated.View>

              {/* Badge */}
              <View style={styles.badge}>
                <LinearGradient
                  colors={['rgba(79,172,254,0.4)', 'rgba(0,242,254,0.3)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.badgeGradient}
                >
                  <Ionicons name="calendar" size={12} color="#fff" />
                  <Text style={styles.badgeText}>7 días</Text>
                </LinearGradient>
              </View>

              {/* Refresh indicator */}
              {refreshing && (
                <View style={styles.refreshIndicator}>
                  <ActivityIndicator size="small" color="#4facfe" />
                </View>
              )}
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
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
    zIndex: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  cardWrapper: {
    flex: 1,
  },
  cardBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  card: {
    padding: 20,
    alignItems: 'center',
    minHeight: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  cardShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ skewX: '-20deg' }],
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  iconGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: -5,
    left: -5,
    zIndex: 0,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 1,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  trendBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginVertical: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 2,
    marginTop: 4,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  trendContainer: {
    marginTop: 8,
    width: '100%',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  trendEmoji: {
    fontSize: 14,
  },
  trendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  refreshIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
});