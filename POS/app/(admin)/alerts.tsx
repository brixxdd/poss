import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, ScrollView, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import SalesChart from '../components/SalesChart';
import SalesSummaryCards from '../components/SalesSummaryCards';
import { useAlert, alertHelpers } from '../components/AlertProvider';

export default function AlertsScreen() {
  const { showAlert } = useAlert();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [runningStockAlerts, setRunningStockAlerts] = useState(false);
  const [runningPredictions, setRunningPredictions] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));

      const alertsResponse = await axios.get(`${BACKEND_URL}/api/analytics/alerts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
      });

      if (!Array.isArray(alertsResponse.data)) {
        console.error('Backend did not return an array');
        alertHelpers.error(showAlert, 'Error', 'El backend retornó datos en formato incorrecto.');
        setAlerts([]);
        return;
      }

      const validAlerts = alertsResponse.data.filter((alert: any) => alert && alert.id);
      setAlerts(validAlerts);
    } catch (error: any) {
      console.error('Error fetching alerts:', error.response?.data || error.message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        alertHelpers.error(showAlert, 'Error de autenticación', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else {
        alertHelpers.error(showAlert, 'Error', 'No se pudieron cargar los datos.');
      }

      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${BACKEND_URL}/api/analytics/run-alerts`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      await fetchData();
      alertHelpers.success(showAlert, '¡Éxito! 🎉', 'Las alertas han sido recalculadas.');
    } catch (error: any) {
      console.error('Error running alerts calculation:', error.response?.data || error.message);
      alertHelpers.error(showAlert, 'Error', 'No se pudo ejecutar el cálculo de alertas.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRunStockAlerts = async () => {
    setRunningStockAlerts(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${BACKEND_URL}/api/analytics/manual-run-stock-alerts`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );
      alertHelpers.success(showAlert, '¡Éxito! ✅', 'Alertas de stock calculadas correctamente');
      await fetchData();
    } catch (error: any) {
      alertHelpers.error(showAlert, 'Error', error.response?.data?.message || 'Error al ejecutar alertas de stock');
    } finally {
      setRunningStockAlerts(false);
    }
  };

  const handleRunPredictions = async () => {
    setRunningPredictions(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${BACKEND_URL}/api/analytics/manual-evaluate-predictions`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );
      alertHelpers.success(showAlert, '¡Éxito! 📊', 'Predicciones evaluadas correctamente');
    } catch (error: any) {
      alertHelpers.error(showAlert, 'Error', error.response?.data?.message || 'Error al evaluar predicciones');
    } finally {
      setRunningPredictions(false);
    }
  };

  const handleItemPress = (alertId: number) => {
    setSelectedAlertId(selectedAlertId === alertId ? null : alertId);
  };

  const handleWhatsAppPress = async () => {
    const phoneNumber = '15556345936';
    const message = '1';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        alertHelpers.error(showAlert, 'Error', 'No se puede abrir WhatsApp en este dispositivo.');
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      alertHelpers.error(showAlert, 'Error', 'Ocurrió un error al abrir WhatsApp.');
    }
  };

  const getSeverityConfig = (severity: number) => {
    switch (severity) {
      case 3:
        return {
          color: '#ff5858',
          gradient: ['#ff5858', '#ff2e63'],
          icon: 'alert-circle',
          label: 'Crítico',
          emoji: '🚨',
          bgColor: 'rgba(255,88,88,0.15)',
        };
      case 2:
        return {
          color: '#ffae42',
          gradient: ['#ffae42', '#ff8c00'],
          icon: 'warning',
          label: 'Medio',
          emoji: '⚠️',
          bgColor: 'rgba(255,174,66,0.15)',
        };
      default:
        return {
          color: '#43e97b',
          gradient: ['#43e97b', '#38f9d7'],
          icon: 'information-circle',
          label: 'Bajo',
          emoji: 'ℹ️',
          bgColor: 'rgba(67,233,123,0.15)',
        };
    }
  };

  const renderAlertItem = ({ item }: { item: any }) => {
    if (!item || !item.id) return null;

    const severityConfig = getSeverityConfig(item.severity);
    const isExpanded = selectedAlertId === item.id;

    return (
      <View style={styles.alertItemWrapper}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => handleItemPress(item.id)}>
          <BlurView intensity={30} tint="dark" style={styles.itemBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.itemContainer}
            >
              {/* Severity Badge */}
              <View style={styles.severityBadge}>
                <LinearGradient
                  colors={severityConfig.gradient as [string, string]}
                  style={styles.severityGradient}
                >
                  <Text style={styles.severityEmoji}>{severityConfig.emoji}</Text>
                </LinearGradient>
              </View>

              {/* Content */}
              <View style={styles.itemInfo}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.product_name || 'Producto desconocido'}
                  </Text>
                  <View style={[styles.severityPill, { backgroundColor: severityConfig.bgColor }]}>
                    <Text style={[styles.severityLabel, { color: severityConfig.color }]}>
                      {severityConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Stock Info */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="cube" size={16} color={severityConfig.color} />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Stock Actual</Text>
                      <Text style={styles.statValue}>{item.current_stock ?? 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="time" size={16} color={severityConfig.color} />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Agotamiento</Text>
                      <Text style={styles.statValue}>
                        {item.days_until_stockout ?? 'N/A'} días
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>Nivel de stock</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min((item.current_stock / 100) * 100, 100)}%`,
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={severityConfig.gradient as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.progressGradient}
                        />
                      </View>
                    </View>
                    <Text style={[styles.progressPercentage, { color: severityConfig.color }]}>
                      {Math.min((item.current_stock / 100) * 100, 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Expand Icon */}
              <View style={styles.expandIcon}>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="rgba(255,255,255,0.7)"
                />
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        {/* Expanded Chart */}
        {isExpanded && (
          <View style={styles.chartContainer}>
            <SalesChart productId={item.product_id} />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0f0c29', '#302b63', '#24243e']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background */}
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BlurView intensity={30} tint="dark" style={styles.headerButtonBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              style={styles.headerButtonGradient}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Dashboard</Text>
          {alerts.length > 0 && (
            <View style={styles.alertBadge}>
              <LinearGradient colors={['#ff5858', '#ff2e63']} style={styles.alertBadgeGradient}>
                <Text style={styles.alertBadgeText}>{alerts.length}</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {user?.role === 'admin' && (
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleWhatsAppPress} style={styles.headerButton}>
              <BlurView intensity={30} tint="dark" style={styles.headerButtonBlur}>
                <LinearGradient
                  colors={['#25D366', '#20B858']}
                  style={styles.headerButtonGradient}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/analytics')} style={styles.headerButton}>
              <BlurView intensity={30} tint="dark" style={styles.headerButtonBlur}>
                <LinearGradient
                  colors={['rgba(79,172,254,0.4)', 'rgba(0,242,254,0.3)']}
                  style={styles.headerButtonGradient}
                >
                  <Ionicons name="stats-chart" size={20} color="#4facfe" />
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing} style={styles.headerButton}>
              <BlurView intensity={30} tint="dark" style={styles.headerButtonBlur}>
                <LinearGradient
                  colors={['rgba(240,147,251,0.4)', 'rgba(245,87,108,0.3)']}
                  style={styles.headerButtonGradient}
                >
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color="#f093fb" />
                  ) : (
                    <Ionicons name="refresh" size={20} color="#f093fb" />
                  )}
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        {/* Sales Summary */}
        <SalesSummaryCards />

        {/* Admin Tasks */}
        {user?.role === 'admin' && (
          <View style={styles.tasksSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrapper}>
                <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.sectionIcon}>
                  <Ionicons name="construct" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.sectionTitle}>Tareas Programadas</Text>
            </View>

            {/* Task Button 1 */}
            <TouchableOpacity
              style={styles.taskButton}
              onPress={handleRunStockAlerts}
              disabled={runningStockAlerts}
              activeOpacity={0.85}
            >
              <BlurView intensity={30} tint="dark" style={styles.taskButtonBlur}>
                <LinearGradient
                  colors={['rgba(67,233,123,0.2)', 'rgba(56,249,215,0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.taskButtonGradient}
                >
                  <View style={styles.taskIconContainer}>
                    <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.taskIcon}>
                      {runningStockAlerts ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="notifications-circle" size={28} color="#fff" />
                      )}
                    </LinearGradient>
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>Calcular Alertas de Stock</Text>
                    <Text style={styles.taskSubtitle}>Ejecutar análisis automático de inventario</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.5)" />
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            {/* Task Button 2 */}
            <TouchableOpacity
              style={styles.taskButton}
              onPress={handleRunPredictions}
              disabled={runningPredictions}
              activeOpacity={0.85}
            >
              <BlurView intensity={30} tint="dark" style={styles.taskButtonBlur}>
                <LinearGradient
                  colors={['rgba(79,172,254,0.2)', 'rgba(0,242,254,0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.taskButtonGradient}
                >
                  <View style={styles.taskIconContainer}>
                    <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.taskIcon}>
                      {runningPredictions ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="analytics" size={28} color="#fff" />
                      )}
                    </LinearGradient>
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>Evaluar Predicciones</Text>
                    <Text style={styles.taskSubtitle}>Analizar tendencias con inteligencia artificial</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.5)" />
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </View>
        )}

        {/* Alerts Section */}
        <View style={styles.alertsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrapper}>
              <LinearGradient
                colors={alerts.length > 0 ? ['#ff5858', '#ff2e63'] : ['#43e97b', '#38f9d7']}
                style={styles.sectionIcon}
              >
                <Ionicons
                  name={alerts.length > 0 ? 'warning' : 'checkmark-circle'}
                  size={20}
                  color="#fff"
                />
              </LinearGradient>
            </View>
            <Text style={styles.sectionTitle}>
              Alertas de Stock {alerts.length > 0 && `(${alerts.length})`}
            </Text>
          </View>

          {alerts.length === 0 ? (
            <View style={styles.emptyState}>
              <BlurView intensity={20} tint="dark" style={styles.emptyBlur}>
                <LinearGradient
                  colors={['rgba(67,233,123,0.15)', 'rgba(56,249,215,0.1)']}
                  style={styles.emptyGradient}
                >
                  <View style={styles.emptyIconContainer}>
                    <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.emptyIcon}>
                      <Ionicons name="checkmark-circle" size={48} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.emptyText}>¡Todo está en orden!</Text>
                  <Text style={styles.emptySubText}>No hay alertas de stock pendientes</Text>
                </LinearGradient>
              </BlurView>
            </View>
          ) : (
            <FlatList
              data={alerts}
              renderItem={renderAlertItem}
              keyExtractor={(item, index) => item?.id?.toString() || `alert-${index}`}
              scrollEnabled={false}
              contentContainerStyle={styles.alertsList}
            />
          )}
        </View>
      </ScrollView>
    </View>
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
    paddingTop: (StatusBar.currentHeight || 40) + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  headerButtonBlur: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  headerButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  alertBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  alertBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  tasksSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  sectionIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#fff',
  },
  taskButton: {
    marginBottom: 0,
  },
  taskButtonBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  taskButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  taskIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  taskIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  alertsSection: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  alertsList: {
    gap: 14,
  },
  alertItemWrapper: {
    marginBottom: 0,
  },
  itemBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  severityBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  severityGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityEmoji: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
    gap: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  severityPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  severityLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressSection: {
    gap: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  expandIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
  },
  chartContainer: {
    marginTop: 12,
  },
  emptyState: {
    marginTop: 20,
  },
  emptyBlur: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(67,233,123,0.3)',
  },
  emptyGradient: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
    gap: 16,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emptyIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
});