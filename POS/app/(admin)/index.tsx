import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAlert, alertHelpers } from '../components/AlertProvider';

const { width, height } = Dimensions.get('window');
const cardWidth = width * 0.42;

const menuItems = [
  {
    title: 'Nuevo Producto',
    icon: 'add-circle-outline',
    route: '/products',
    gradient: ['#667eea', '#764ba2'] as [string, string],
    shadowColor: '#667eea',
  },
  {
    title: 'Gestionar Productos',
    icon: 'cube-outline',
    route: '/products/manage',
    gradient: ['#4facfe', '#00f2fe'] as [string, string],
    shadowColor: '#4facfe',
  },
  {
    title: 'Proveedores',
    icon: 'people-outline',
    route: '/providers',
    gradient: ['#f093fb', '#f5576c'] as [string, string],
    shadowColor: '#f093fb',
  },
  {
    title: 'Usuarios',
    icon: 'person-circle-outline',
    route: '/users',
    gradient: ['#43e97b', '#38f9d7'] as [string, string],
    shadowColor: '#43e97b',
  },
];

export default function AdminIndex() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const cardAnims = useRef(menuItems.map(() => ({
    scale: new Animated.Value(0),
    rotate: new Animated.Value(0),
    translateY: new Animated.Value(50),
  }))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    fetchUser();

    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de tarjetas con efecto 3D
    const cardAnimations = cardAnims.map((anim, index) => {
      return Animated.parallel([
        Animated.spring(anim.scale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          delay: 200 + index * 150,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          tension: 40,
          friction: 7,
          delay: 200 + index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 1,
          duration: 800,
          delay: 200 + index * 150,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(150, cardAnimations).start();

    // Animación de pulso continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación flotante
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de brillo
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();

    // Actualizar hora
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    alertHelpers.confirmDestructive(
      showAlert,
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder a la aplicación.',
      'Cerrar Sesión',
      async () => {
        // Animación de salida
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          ...cardAnims.map(anim =>
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          ),
        ]).start(async () => {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('user');

          // Mostrar alerta de éxito
          alertHelpers.success(
            showAlert,
            'Sesión Cerrada',
            'Has cerrado sesión exitosamente. ¡Hasta pronto!',
            () => router.replace('/login')
          );
        });
      }
    );
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: 'Buenos Días', emoji: '☀️' };
    if (hour < 18) return { text: 'Buenas Tardes', emoji: '🌤️' };
    return { text: 'Buenas Noches', emoji: '🌙' };
  };

  const handleCardPress = (route: string, index: number) => {
    // Animación de presión con efecto 3D
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardAnims[index].scale, {
          toValue: 0.92,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(cardAnims[index].rotate, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(cardAnims[index].scale, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnims[index].rotate, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(() => router.push(`/(admin)${route}` as any), 200);
  };

  const renderMenuItem = (item: typeof menuItems[0], index: number) => {
    const { scale, rotate, translateY } = cardAnims[index];

    const rotateInterpolate = rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['-10deg', '0deg'],
    });

    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-cardWidth * 2, cardWidth * 2],
    });

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [
              { scale },
              { translateY },
              { rotate: rotateInterpolate },
            ]
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleCardPress(item.route, index)}
        >
          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.card,
                {
                  shadowColor: item.shadowColor,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }
              ]}
            >
              {/* Efecto de brillo */}
              <Animated.View
                style={[
                  styles.shimmer,
                  { transform: [{ translateX: shimmerTranslate }] }
                ]}
              />

              {/* Contenido de la tarjeta */}
              <View style={styles.cardContent}>
                <View style={styles.iconCircle}>
                  <View style={styles.iconInner}>
                    <Ionicons name={item.icon as any} size={36} color="#fff" />
                  </View>
                </View>
                <Text style={styles.cardText}>{item.title}</Text>

                {/* Indicador de acción */}
                <View style={styles.actionIndicator}>
                  <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
                </View>
              </View>

              {/* Patrón decorativo */}
              <View style={styles.decorativePattern}>
                <View style={styles.patternDot} />
                <View style={[styles.patternDot, { top: 10, left: 10 }]} />
                <View style={[styles.patternDot, { top: 20, left: 5 }]} />
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const greeting = getGreeting();
  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fondo con gradiente oscuro elegante */}
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Elementos decorativos flotantes */}
      <Animated.View
        style={[
          styles.floatingCircle1,
          { transform: [{ translateY: floatTranslate }] }
        ]}
      />
      <Animated.View
        style={[
          styles.floatingCircle2,
          { transform: [{ translateY: Animated.multiply(floatTranslate, -1) }] }
        ]}
      />
      <Animated.View
        style={[
          styles.floatingCircle3,
          { transform: [{ translateY: floatTranslate }] }
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header mejorado con tarjeta de bienvenida */}
        <Stack.Screen
          options={{
            headerShown: false, // Hide default header as we have a custom one
          }}
        />
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <BlurView intensity={20} tint="dark" style={styles.welcomeCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.welcomeGradient}
            >
              <View style={styles.welcomeContent}>
                <View style={styles.greetingSection}>
                  <Text style={styles.emoji}>{greeting.emoji}</Text>
                  <View>
                    <Text style={styles.greetingText}>{greeting.text}</Text>
                    <Text style={styles.username}>{user?.username || 'Guest'}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.profileButton}>
                  <View style={styles.profileCircle}>
                    <Text style={styles.profileInitial}>
                      {(user?.username || 'G')[0].toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Mini estadísticas */}
              <View style={styles.miniStats}>
                <View style={styles.miniStatItem}>
                  <Ionicons name="trending-up" size={16} color="#43e97b" />
                  <Text style={styles.miniStatText}>+24%</Text>
                </View>
                <View style={styles.miniStatDivider} />
                <View style={styles.miniStatItem}>
                  <Ionicons name="cube" size={16} color="#4facfe" />
                  <Text style={styles.miniStatText}>234</Text>
                </View>
                <View style={styles.miniStatDivider} />
                <View style={styles.miniStatItem}>
                  <Ionicons name="time" size={16} color="#f5576c" />
                  <Text style={styles.miniStatText}>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Grid de tarjetas */}
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <View key={item.route}>
              {renderMenuItem(item, index)}
            </View>
          ))}
        </View>

        {/* Botón de logout moderno */}
        <Animated.View
          style={[
            styles.logoutWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <BlurView intensity={30} tint="dark" style={styles.logoutButton}>
              <LinearGradient
                colors={['rgba(255,88,88,0.3)', 'rgba(255,27,27,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.logoutGradient}
              >
                <View style={styles.logoutIconCircle}>
                  <Ionicons name="log-out-outline" size={22} color="#ff6b6b" />
                </View>
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
                <View style={styles.logoutArrow}>
                  <Ionicons name="arrow-forward" size={18} color="rgba(255,107,107,0.6)" />
                </View>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  floatingCircle1: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
  },
  floatingCircle2: {
    position: 'absolute',
    top: 300,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(118, 75, 162, 0.06)',
  },
  floatingCircle3: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(67, 233, 123, 0.05)',
  },
  header: {
    width: '90%',
    marginBottom: 30,
  },
  welcomeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  welcomeGradient: {
    padding: 20,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 36,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
  username: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  profileButton: {
    padding: 2,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStatText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  miniStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 10,
    gap: 16,
  },
  cardContainer: {
    width: cardWidth,
    marginBottom: 16,
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 1,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  actionIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativePattern: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  patternDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    position: 'absolute',
  },
  logoutWrapper: {
    width: '90%',
    marginTop: 20,
  },
  logoutButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  logoutIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,107,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  logoutArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,107,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});