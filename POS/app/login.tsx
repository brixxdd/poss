// app/login.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from './constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAlert, alertHelpers } from './components/AlertProvider';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animaciones de partículas flotantes
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotación continua del logo
    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Pulso continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Partículas flotantes
    const floatParticle = (particle: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particle, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    floatParticle(particle1, 0);
    floatParticle(particle2, 1000);
    floatParticle(particle3, 2000);
  }, []);

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      shakeAnimation();
      alertHelpers.error(showAlert, 'Error', '¡Por favor completa todos los campos! 📝');
      return;
    }

    setLoading(true);

    // Animación de loading (solo una vez, no en bucle)
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username: username.trim(),
        password,
      });

      const { token, user } = response.data;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Animación de éxito
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start(() => {
        alertHelpers.success(showAlert, '¡Éxito! 🎉', `Bienvenido ${user.username}!`, () => {
          if (user.role === 'admin') {
            router.replace('/(admin)');
          } else {
            router.replace('/(tabs)');
          }
        });
      });
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      
      // Animación de error simple (solo una vez)
      shakeAnimation();

      alertHelpers.error(
        showAlert,
        '❌ Error',
        error.response?.data?.message || 'Credenciales incorrectas. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const particleTranslate1 = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100],
  });

  const particleTranslate2 = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -150],
  });

  const particleTranslate3 = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fondo con gradiente animado */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      >
        {/* Partículas flotantes */}
        <Animated.View
          style={[
            styles.particle,
            {
              left: '20%',
              top: '30%',
              transform: [{ translateY: particleTranslate1 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            {
              right: '15%',
              top: '50%',
              transform: [{ translateY: particleTranslate2 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            {
              left: '70%',
              top: '20%',
              transform: [{ translateY: particleTranslate3 }],
            },
          ]}
        />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Logo animado */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { rotate: spin },
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="cart" size={60} color="#fff" />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>Punto de Venta</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

          {/* Tarjeta con glassmorphism */}
          <BlurView intensity={30} tint="light" style={styles.card}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#667eea" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Usuario"
                placeholderTextColor="rgba(102, 126, 234, 0.6)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#667eea" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="rgba(102, 126, 234, 0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#667eea"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="reload" size={24} color="#fff" />
                  </Animated.View>
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.replace('/register')}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>Crear cuenta nueva</Text>
              <Ionicons name="person-add-outline" size={18} color="#667eea" />
            </TouchableOpacity>
          </BlurView>

          <Text style={styles.footer}>© 2025 POS System</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
  },
  card: {
    width: '100%',
    borderRadius: 30,
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    width: '100%',
    height: 55,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dividerText: {
    marginHorizontal: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  registerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
  },
  registerButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  particle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});