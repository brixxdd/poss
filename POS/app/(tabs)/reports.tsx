import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface ReportCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  stats?: {
    label: string;
    value: string;
  }[];
  comingSoon?: boolean;
}

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'daily-sales',
    title: 'Ventas Diarias',
    subtitle: 'Reporte detallado de ventas por día',
    icon: 'calendar',
    gradient: ['#43e97b', '#38f9d7'],
    stats: [
      { label: 'Hoy', value: '$1,250' },
      { label: 'Transacciones', value: '24' },
    ],
  },
  {
    id: 'monthly-sales',
    title: 'Ventas Mensuales',
    subtitle: 'Resumen completo del mes',
    icon: 'stats-chart',
    gradient: ['#4facfe', '#00f2fe'],
    stats: [
      { label: 'Este Mes', value: '$32,500' },
      { label: 'vs Anterior', value: '+12%' },
    ],
  },
  {
    id: 'products',
    title: 'Análisis de Productos',
    subtitle: 'Rendimiento por producto',
    icon: 'cube',
    gradient: ['#f093fb', '#f5576c'],
    stats: [
      { label: 'Top 10', value: '85%' },
      { label: 'Categorías', value: '12' },
    ],
  },
  {
    id: 'inventory',
    title: 'Estado de Inventario',
    subtitle: 'Stock y movimientos',
    icon: 'albums',
    gradient: ['#ffae42', '#ff8c00'],
    stats: [
      { label: 'Productos', value: '156' },
      { label: 'Bajo Stock', value: '8' },
    ],
  },
  {
    id: 'customers',
    title: 'Clientes Frecuentes',
    subtitle: 'Top clientes y patrones',
    icon: 'people',
    gradient: ['#667eea', '#764ba2'],
    comingSoon: true,
  },
  {
    id: 'profit',
    title: 'Márgenes de Ganancia',
    subtitle: 'Análisis de rentabilidad',
    icon: 'trending-up',
    gradient: ['#43e97b', '#38f9d7'],
    comingSoon: true,
  },
];

export default function ReportsScreen() {
  const router = useRouter();

  const handleReportPress = (reportId: string) => {
    console.log('Report pressed:', reportId);
    // Aquí se navegará a la pantalla específica del reporte
  };

  const renderReportCard = (report: ReportCard) => (
    <TouchableOpacity
      key={report.id}
      style={styles.cardWrapper}
      onPress={() => handleReportPress(report.id)}
      activeOpacity={0.85}
      disabled={report.comingSoon}
    >
      <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Icon */}
          <View style={styles.cardIconContainer}>
            <LinearGradient colors={report.gradient as [string, string]} style={styles.cardIcon}>
              <Ionicons name={report.icon as any} size={28} color="#fff" />
            </LinearGradient>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{report.title}</Text>
              {report.comingSoon && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Próximamente</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSubtitle}>{report.subtitle}</Text>

            {/* Stats */}
            {report.stats && (
              <View style={styles.statsContainer}>
                {report.stats.map((stat, index) => (
                  <View key={index} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Arrow */}
          <View style={styles.cardArrow}>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={report.comingSoon ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)'}
            />
          </View>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      <Text style={styles.sectionTitle}>Resumen Rápido</Text>
      <View style={styles.quickStatsGrid}>
        {/* Stat 1 */}
        <View style={styles.quickStatCard}>
          <BlurView intensity={25} tint="dark" style={styles.quickStatBlur}>
            <LinearGradient
              colors={['rgba(67,233,123,0.2)', 'rgba(56,249,215,0.1)']}
              style={styles.quickStatGradient}
            >
              <View style={styles.quickStatIconContainer}>
                <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.quickStatIcon}>
                  <Ionicons name="cash" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.quickStatValue}>$45,230</Text>
              <Text style={styles.quickStatLabel}>Ventas Totales</Text>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Stat 2 */}
        <View style={styles.quickStatCard}>
          <BlurView intensity={25} tint="dark" style={styles.quickStatBlur}>
            <LinearGradient
              colors={['rgba(79,172,254,0.2)', 'rgba(0,242,254,0.1)']}
              style={styles.quickStatGradient}
            >
              <View style={styles.quickStatIconContainer}>
                <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.quickStatIcon}>
                  <Ionicons name="receipt" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.quickStatValue}>342</Text>
              <Text style={styles.quickStatLabel}>Transacciones</Text>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Stat 3 */}
        <View style={styles.quickStatCard}>
          <BlurView intensity={25} tint="dark" style={styles.quickStatBlur}>
            <LinearGradient
              colors={['rgba(240,147,251,0.2)', 'rgba(245,87,108,0.1)']}
              style={styles.quickStatGradient}
            >
              <View style={styles.quickStatIconContainer}>
                <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.quickStatIcon}>
                  <Ionicons name="trending-up" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.quickStatValue}>+18%</Text>
              <Text style={styles.quickStatLabel}>Crecimiento</Text>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Stat 4 */}
        <View style={styles.quickStatCard}>
          <BlurView intensity={25} tint="dark" style={styles.quickStatBlur}>
            <LinearGradient
              colors={['rgba(255,174,66,0.2)', 'rgba(255,140,0,0.1)']}
              style={styles.quickStatGradient}
            >
              <View style={styles.quickStatIconContainer}>
                <LinearGradient colors={['#ffae42', '#ff8c00']} style={styles.quickStatIcon}>
                  <Ionicons name="cube" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.quickStatValue}>156</Text>
              <Text style={styles.quickStatLabel}>Productos</Text>
            </LinearGradient>
          </BlurView>
        </View>
      </View>
    </View>
  );

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
          <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerIconWrapper}>
            <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.headerIcon}>
              <Ionicons name="document-text" size={28} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Reportes</Text>
          <Text style={styles.subtitle}>Centro de Análisis de Datos</Text>
        </View>

        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Reports Section */}
        <View style={styles.reportsSection}>
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionIconWrapper}>
              <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.sectionIcon}>
                <Ionicons name="analytics" size={18} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.sectionTitle}>Reportes Disponibles</Text>
          </View>

          <View style={styles.cardsContainer}>
            {REPORT_CARDS.map(renderReportCard)}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <BlurView intensity={20} tint="dark" style={styles.infoBlur}>
            <LinearGradient
              colors={['rgba(79,172,254,0.15)', 'rgba(0,242,254,0.1)']}
              style={styles.infoGradient}
            >
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={24} color="#4facfe" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Exportar Reportes</Text>
                <Text style={styles.infoText}>
                  Próximamente podrás exportar todos los reportes en formato PDF y Excel
                </Text>
              </View>
            </LinearGradient>
          </BlurView>
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
  backButtonBlur: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  headerIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerIcon: {
    flex: 1,
    justifyContent: 'center',
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  quickStatsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  quickStatCard: {
    width: (width - 52) / 2,
  },
  quickStatBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quickStatGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickStatIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  quickStatIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  reportsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  cardsContainer: {
    gap: 14,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  cardBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,174,66,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,174,66,0.3)',
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffae42',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  statItem: {
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  cardArrow: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  infoBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79,172,254,0.3)',
  },
  infoGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79,172,254,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
});