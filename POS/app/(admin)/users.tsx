import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  TextInput,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAlert, alertHelpers } from '../components/AlertProvider';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';

const { width } = Dimensions.get('window');

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'employee' | 'manager';
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
}

const ROLE_COLORS = {
  admin: ['#f093fb', '#f5576c'],
  manager: ['#4facfe', '#00f2fe'],
  employee: ['#43e97b', '#38f9d7'],
};

const ROLE_LABELS = {
  admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Empleado',
};

export default function ManageUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!loading) {
      startAnimations();
    }
  }, [loading]);

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

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedRole, selectedStatus]);

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
      Animated.spring(statsAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${BACKEND_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      alertHelpers.error(
        showAlert,
        'Error',
        'No se pudieron cargar los usuarios. Verifica tu conexión.'
      );
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filtro de búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro de rol
    if (selectedRole !== 'all') {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    // Filtro de estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((user) => user.status === selectedStatus);
    }

    setFilteredUsers(filtered);
  };

  const handleAddUser = () => {
    alertHelpers.info(
      showAlert,
      'Agregar Usuario',
      'Función para agregar nuevo usuario. Implementar formulario de registro.',
      () => {
        // router.push('/(admin)/users/add');
      }
    );
  };

  const handleEditUser = (user: User) => {
    alertHelpers.info(
      showAlert,
      'Editar Usuario',
      `Editar información de: ${user.username}`,
      () => {
        // router.push(`/(admin)/users/${user.id}`);
      }
    );
  };

  const handleDeleteUser = (user: User) => {
    alertHelpers.warning(
      showAlert,
      '¿Eliminar Usuario?',
      `¿Estás seguro de eliminar a ${user.username}? Esta acción no se puede deshacer.`,
      async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          await axios.delete(`${BACKEND_URL}/api/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
          alertHelpers.success(showAlert, 'Usuario Eliminado', `${user.username} fue eliminado correctamente.`);
        } catch (error: any) {
          console.error('Error deleting user:', error);
          alertHelpers.error(
            showAlert,
            'Error',
            'No se pudo eliminar el usuario. Intenta de nuevo.'
          );
        }
      }
    );
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${BACKEND_URL}/api/users/${user.id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      );
      
      alertHelpers.success(
        showAlert,
        'Estado Actualizado',
        `${user.username} ahora está ${newStatus === 'active' ? 'activo' : 'inactivo'}.`
      );
    } catch (error: any) {
      console.error('Error updating user status:', error);
      alertHelpers.error(
        showAlert,
        'Error',
        'No se pudo actualizar el estado del usuario. Intenta de nuevo.'
      );
    }
  };

  const getStats = () => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const managers = users.filter((u) => u.role === 'manager').length;
    const employees = users.filter((u) => u.role === 'employee').length;

    return { total, active, admins, managers, employees };
  };

  const renderStatCard = (
    icon: string,
    label: string,
    value: number,
    gradient: string[],
    delay: number = 0
  ) => {
    const scale = statsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <Animated.View
        style={[
          styles.statCard,
          {
            opacity: statsAnim,
            transform: [{ scale }],
          },
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.statBlur}>
          <LinearGradient
            colors={gradient as [string, string]}
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
  };

  const renderFilterPill = (
    type: 'role' | 'status',
    value: string,
    label: string
  ) => {
    const isSelected =
      type === 'role' ? selectedRole === value : selectedStatus === value;

    return (
      <TouchableOpacity
        key={value}
        activeOpacity={0.8}
        onPress={() => {
          if (type === 'role') {
            setSelectedRole(value);
          } else {
            setSelectedStatus(value);
          }
        }}
      >
        <Animated.View style={[styles.filterPill, { opacity: fadeAnim }]}>
          {isSelected ? (
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.filterPillGradient}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.filterPillTextSelected}>{label}</Text>
            </LinearGradient>
          ) : (
            <BlurView intensity={20} tint="dark" style={styles.filterPillBlur}>
              <Text style={styles.filterPillText}>{label}</Text>
            </BlurView>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderUserCard = ({ item, index }: { item: User; index: number }) => {
    return (
      <Animated.View
        style={[
          styles.userCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim,
              },
            ],
          },
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.userBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userGradient}
          >
            {/* Avatar */}
            <View style={styles.userAvatar}>
              <LinearGradient
                colors={ROLE_COLORS[item.role] as [string, string]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {item.username.substring(0, 2).toUpperCase()}
                </Text>
              </LinearGradient>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{item.username}</Text>
                {item.status === 'active' && (
                  <View style={styles.activeIndicator}>
                    <View style={styles.activeDot} />
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{item.email}</Text>

              {/* Role Badge */}
              <View style={styles.roleBadge}>
                <LinearGradient
                  colors={ROLE_COLORS[item.role] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.roleBadgeGradient}
                >
                  <Ionicons
                    name={
                      item.role === 'admin'
                        ? 'shield-checkmark'
                        : item.role === 'manager'
                        ? 'briefcase'
                        : 'person'
                    }
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.roleText}>{ROLE_LABELS[item.role]}</Text>
                </LinearGradient>
              </View>

              {/* Last Login */}
              {item.last_login && (
                <View style={styles.lastLoginRow}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color="rgba(255,255,255,0.5)"
                  />
                  <Text style={styles.lastLoginText}>
                    Último acceso: {item.last_login}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleToggleStatus(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    item.status === 'active'
                      ? ['rgba(255,88,88,0.3)', 'rgba(255,88,88,0.2)']
                      : ['rgba(67,233,123,0.3)', 'rgba(67,233,123,0.2)']
                  }
                  style={styles.actionButtonGradient}
                >
                  <Ionicons
                    name={item.status === 'active' ? 'pause' : 'play'}
                    size={18}
                    color={item.status === 'active' ? '#ff5858' : '#43e97b'}
                  />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditUser(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(79,172,254,0.3)', 'rgba(79,172,254,0.2)']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="create" size={18} color="#4facfe" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteUser(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(255,88,88,0.3)', 'rgba(255,88,88,0.2)']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="trash" size={18} color="#ff5858" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    );
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0f0c29', '#302b63', '#24243e']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#f093fb" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  const stats = getStats();

  return (
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Gestión de Usuarios</Text>
          <Text style={styles.subtitle}>{users.length} usuarios registrados</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.refreshGradient}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleAddUser} style={styles.addHeaderButton}>
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              style={styles.addHeaderGradient}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shimmer */}
        <Animated.View
          style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]}
        />

        {/* Stats */}
        <View style={styles.statsContainer}>
          {renderStatCard(
            'people',
            'Total',
            stats.total,
            ['rgba(240,147,251,0.3)', 'rgba(245,87,108,0.2)']
          )}
          {renderStatCard(
            'checkmark-circle',
            'Activos',
            stats.active,
            ['rgba(67,233,123,0.3)', 'rgba(56,249,215,0.2)']
          )}
          {renderStatCard(
            'shield-checkmark',
            'Admins',
            stats.admins,
            ['rgba(240,147,251,0.3)', 'rgba(245,87,108,0.2)']
          )}
        </View>

        {/* Search */}
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
          <BlurView intensity={20} tint="dark" style={styles.searchBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchGradient}
            >
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o email..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              )}
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Filters */}
        <Animated.View style={[styles.filtersContainer, { opacity: fadeAnim }]}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Rol:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterPills}>
                {renderFilterPill('role', 'all', 'Todos')}
                {renderFilterPill('role', 'admin', 'Admin')}
                {renderFilterPill('role', 'manager', 'Gerente')}
                {renderFilterPill('role', 'employee', 'Empleado')}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Estado:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterPills}>
                {renderFilterPill('status', 'all', 'Todos')}
                {renderFilterPill('status', 'active', 'Activos')}
                {renderFilterPill('status', 'inactive', 'Inactivos')}
              </View>
            </ScrollView>
          </View>
        </Animated.View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {filteredUsers.length === 0 ? 'Sin resultados' : 'Usuarios'}
            </Text>
            <Text style={styles.sectionCount}>
              {filteredUsers.length} de {users.length}
            </Text>
          </View>

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No se encontraron usuarios</Text>
              <Text style={styles.emptySubtext}>
                Intenta ajustar los filtros de búsqueda
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.usersList}
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
  addHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(67,233,123,0.5)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(79,172,254,0.5)',
  },
  refreshGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHeaderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    padding: 12,
    gap: 10,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#fff',
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    marginBottom: 20,
    gap: 12,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 10,
  },
  filterPill: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterPillBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterPillTextSelected: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  usersSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    marginBottom: 0,
  },
  userBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  userGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(67,233,123,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#43e97b',
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  roleBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  lastLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lastLoginText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  userActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
});