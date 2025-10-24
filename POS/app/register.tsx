// app/register.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BACKEND_URL } from './constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Partículas
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada con efecto cascada
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación flotante continua
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Partículas flotantes con diferentes velocidades
    const animateParticle = (particle: Animated.Value, duration: number, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateParticle(particle1, 4000, 0);
    animateParticle(particle2, 3500, 500);
    animateParticle(particle3, 4500, 1000);
    animateParticle(particle4, 3000, 1500);
  }, []);

  const handleRegister = async () => {
    // Validaciones
    let hasError = false;
    if (!username.trim()) {
      Alert.alert('❌ Error', 'Por favor ingresa un nombre de usuario');
      hasError = true;
    } else if (!password.trim()) {
      Alert.alert('❌ Error', 'Por favor ingresa una contraseña');
      hasError = true;
    } else if (password.length < 6) {
      Alert.alert('❌ Error', 'La contraseña debe tener al menos 6 caracteres');
      hasError = true;
    } else if (password !== confirmPassword) {
      Alert.alert('❌ Error', 'Las contraseñas no coinciden');
      hasError = true;
    }

    if (hasError) {
      shakeAnimation();
      return;
    }

    setLoading(true);

    // Animación de loading
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    try {
      const payload = {
        username: username.trim(),
        password: password,
        role: role.toLowerCase().trim(),
      };

      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log('✅ Response:', response.data);

      // Animación de éxito
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Alert.alert(
          '🎉 ¡Registro Exitoso!',
          `¡Bienvenido ${username}! Tu cuenta ha sido creada.`,
          [
            {
              text: 'Iniciar Sesión',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      });
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      shakeAnimation();

      let errorMessage = 'No se pudo registrar. Intenta de nuevo.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.details || 
                      `Error ${error.response.status}`;
      } else if (error.request) {
        errorMessage = `No se pudo conectar al servidor en ${BACKEND_URL}`;
      }

      Alert.alert('❌ Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const particleTransform = (particle: Animated.Value, startPos: number, endPos: number) => {
    return particle.interpolate({
      inputRange: [0, 1],
      outputRange: [startPos, endPos],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fondo con gradiente */}
      <LinearGradient
        colors={['#11998e', '#38ef7d', '#4facfe', '#00f2fe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      >
        {/* Partículas flotantes */}
        <Animated.View
          style={[
            styles.particle,
            {
              left: '15%',
              top: '25%',
              transform: [{ translateY: particleTransform(particle1, 0, -120) }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            {
              right: '10%',
              top: '40%',
              transform: [{ translateY: particleTransform(particle2, 0, -100) }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            {
              left: '65%',
              top: '15%',
              transform: [{ translateY: particleTransform(particle3, 0, -130) }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            {
              left: '30%',
              top: '60%',
              transform: [{ translateY: particleTransform(particle4, 0, -110) }],
            },
          ]}
        />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
                    { scale: logoScale },
                    { translateY: floatTranslate },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#11998e', '#38ef7d']}
                style={styles.logo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person-add" size={60} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a nuestro sistema POS</Text>

            {/* Tarjeta con glassmorphism */}
            <BlurView intensity={30} tint="light" style={styles.card}>
              {/* Username */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#11998e" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de usuario"
                  placeholderTextColor="rgba(17, 153, 142, 0.6)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#11998e" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="rgba(17, 153, 142, 0.6)"
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
                    color="#11998e"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#11998e" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="rgba(17, 153, 142, 0.6)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#11998e"
                  />
                </TouchableOpacity>
              </View>

              {/* Role Selector */}
              <Text style={styles.roleLabel}>Selecciona tu rol:</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'employee' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('employee')}
                  disabled={loading}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={24}
                    color={role === 'employee' ? '#fff' : '#11998e'}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'employee' && styles.roleButtonTextActive,
                    ]}
                  >
                    Empleado
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'admin' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('admin')}
                  disabled={loading}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={24}
                    color={role === 'admin' ? '#fff' : '#11998e'}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'admin' && styles.roleButtonTextActive,
                    ]}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#ccc', '#999'] : ['#11998e', '#38ef7d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButtonGradient}
                >
                  {loading ? (
                    <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
                      <Ionicons name="hourglass-outline" size={24} color="#fff" />
                    </Animated.View>
                  ) : (
                    <>
                      <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Ya tienes cuenta</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.replace('/login')}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                <Ionicons name="log-in-outline" size={18} color="#11998e" />
              </TouchableOpacity>
            </BlurView>

            <Text style={styles.footer}>© 2025 POS System</Text>
          </Animated.View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
    marginBottom: 30,
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
  roleLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 5,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: '#11998e',
    borderColor: '#38ef7d',
  },
  roleButtonText: {
    color: '#11998e',
    fontSize: 16,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  registerButton: {
    width: '100%',
    height: 55,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#11998e',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  registerButtonText: {
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
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
  },
  loginButtonText: {
    color: '#11998e',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});