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
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.4;

const menuItems = [
  { title: 'Manage Products', icon: 'cube-outline', route: '/products' },
  { title: 'Manage Providers', icon: 'people-outline', route: '/providers' },
  { title: 'New Sale', icon: 'cash-outline', route: '/sales' },
  { title: 'View Inventory', icon: 'archive-outline', route: '/inventory' },
  { title: 'Stock Alerts', icon: 'warning-outline', route: '/alerts' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const animatedValues = useRef(menuItems.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    fetchUser();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const animations = menuItems.map((_, i) => {
      return Animated.spring(animatedValues[i], {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: i * 100,
        useNativeDriver: true,
      });
    });
    Animated.stagger(100, animations).start();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    router.replace('/login');
  };

  const renderMenuItem = (item: typeof menuItems[0], index: number) => {
    const scale = animatedValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });
    const opacity = animatedValues[index];

    return (
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push(item.route)}
        >
          <BlurView intensity={50} tint="light" style={styles.card}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.cardGradient}
            >
              <Ionicons name={item.icon as any} size={48} color="#fff" />
              <Text style={styles.cardText}>{item.title}</Text>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Welcome back,</Text>
          <Text style={styles.username}>{user?.username || 'Guest'}!</Text>
        </Animated.View>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <View key={item.route} style={styles.cardContainer}>
              {renderMenuItem(item, index)}
            </View>
          ))}
        </View>

        <Animated.View style={{ opacity: fadeAnim, width: '90%' }}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff5858', '#ff1b1b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutButtonGradient}
            >
              <Ionicons name="log-out-outline" size={22} color="#fff" />
              <Text style={styles.logoutButtonText}>Logout</Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  username: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
  },
  cardContainer: {
    width: cardWidth + 20,
    height: cardWidth + 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: -10
  },
  card: {
    width: cardWidth,
    height: cardWidth,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  logoutButton: {
    width: '100%',
    height: 55,
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#ff1b1b',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  logoutButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});