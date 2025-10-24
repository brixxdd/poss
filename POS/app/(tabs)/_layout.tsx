import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';

// Componente de ícono animado personalizado
function AnimatedTabBarIcon({ 
  name, 
  color, 
  focused, 
  gradientColors 
}: { 
  name: string; 
  color: string; 
  focused: boolean;
  gradientColors: string[];
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      // Animación de escala
      Animated.spring(scaleAnim, {
        toValue: 1.15,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }).start();

      // Animación de pulso continuo
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

      // Animación de rotación suave
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.iconContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      {focused && (
        <>
          {/* Círculo de fondo con gradiente */}
          <Animated.View 
            style={[
              styles.iconBackground,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            />
          </Animated.View>
          
          {/* Anillo exterior animado */}
          <Animated.View 
            style={[
              styles.iconRing,
              { 
                transform: [
                  { scale: pulseAnim },
                  { rotate }
                ] 
              }
            ]}
          >
            <View style={styles.ringDot1} />
            <View style={styles.ringDot2} />
            <View style={styles.ringDot3} />
          </Animated.View>
        </>
      )}
      
      {/* Ícono */}
      <Animated.View style={{ transform: [{ rotate: focused ? rotate : '0deg' }] }}>
        <Ionicons 
          name={name} 
          size={focused ? 28 : 24} 
          color={color}
          style={focused && styles.iconShadow}
        />
      </Animated.View>
      
      {/* Punto indicador */}
      {focused && (
        <Animated.View 
          style={[
            styles.activeIndicator,
            { transform: [{ scale: pulseAnim }] }
          ]}
        />
      )}
    </Animated.View>
  );
}

// Componente de fondo del TabBar personalizado
function CustomTabBarBackground() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View style={styles.tabBarBackground}>
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 90} tint="dark" style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={[
            'rgba(15,12,41,0.98)', 
            'rgba(48,43,99,0.95)',
            'rgba(36,36,62,0.97)'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Efecto shimmer */}
        <Animated.View 
          style={[
            styles.shimmer,
            { transform: [{ translateX: shimmerTranslate }] }
          ]}
        />
      </BlurView>
      
      {/* Borde superior brillante */}
      <LinearGradient
        colors={[
          'rgba(79,172,254,0.3)',
          'rgba(102,126,234,0.2)',
          'rgba(118,75,162,0.3)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorder}
      />
    </View>
  );
}

export default function EmployeeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 15,
          right: 15,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 75,
          paddingBottom: 10,
        },
        tabBarBackground: () => <CustomTabBarBackground />,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ventas',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0f0c29',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 22,
            letterSpacing: 0.5,
          },
          headerBackground: () => (
            <LinearGradient
              colors={['#0f0c29', '#302b63', '#24243e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          ),
          headerShadowVisible: false,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon
              name={focused ? "cart" : "cart-outline"}
              color={color}
              focused={focused}
              gradientColors={['rgba(79,172,254,0.25)', 'rgba(0,242,254,0.25)']}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('sales' as any);
          },
        })}
      />
      <Tabs.Screen
        name="sales"
        options={{
          href: null, // Ocultar del tab bar
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventario',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0f0c29',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 22,
            letterSpacing: 0.5,
          },
          headerBackground: () => (
            <LinearGradient
              colors={['#0f0c29', '#302b63', '#24243e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          ),
          headerShadowVisible: false,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon
              name={focused ? "list" : "list-outline"}
              color={color}
              focused={focused}
              gradientColors={['rgba(67,233,123,0.25)', 'rgba(56,249,215,0.25)']}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0f0c29',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 22,
            letterSpacing: 0.5,
          },
          headerBackground: () => (
            <LinearGradient
              colors={['#0f0c29', '#302b63', '#24243e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          ),
          headerShadowVisible: false,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon
              name={focused ? "analytics" : "analytics-outline"}
              color={color}
              focused={focused}
              gradientColors={['rgba(240,147,251,0.25)', 'rgba(245,87,108,0.25)']}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 150,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ skewX: '-20deg' }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconBackground: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    borderRadius: 26,
  },
  iconRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  ringDot1: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  ringDot2: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  ringDot3: {
    position: 'absolute',
    top: '50%',
    right: -4,
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  iconShadow: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4facfe',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
});