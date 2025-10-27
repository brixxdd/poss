import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getPendingSyncsCount } from '../utils/offlineStorage';

export const NetworkStatus = () => {
  const { isConnected } = useNetworkStatus();
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const slideAnim = new Animated.Value(-100);

  useEffect(() => {
    if (isConnected === false) {
      // Show offline banner
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Hide offline banner
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [isConnected]);

  useEffect(() => {
    // Count pending syncs
    const updatePendingSyncs = async () => {
      try {
        const count = await getPendingSyncsCount();
        setPendingSyncs(count);
      } catch (error) {
        console.error('Error counting pending syncs:', error);
      }
    };

    updatePendingSyncs();
    const interval = setInterval(updatePendingSyncs, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return null; // Still checking network status
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {isConnected ? (
        // Online indicator
        <BlurView intensity={20} tint="dark" style={styles.blurView}>
          <LinearGradient
            colors={['rgba(67,233,123,0.2)', 'rgba(56,249,215,0.2)']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <Ionicons name="wifi" size={16} color="#43e97b" />
              <Text style={styles.textOnline}>En línea</Text>
              {pendingSyncs > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingSyncs}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </BlurView>
      ) : (
        // Offline indicator
        <BlurView intensity={20} tint="dark" style={styles.blurView}>
          <LinearGradient
            colors={['rgba(250,112,154,0.2)', 'rgba(254,225,64,0.2)']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <Ionicons name="cloud-offline" size={16} color="#fa709a" />
              <Text style={styles.textOffline}>Modo Offline</Text>
              {pendingSyncs > 0 && (
                <View style={styles.badgeOffline}>
                  <Text style={styles.badgeText}>{pendingSyncs}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </BlurView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  blurView: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textOnline: {
    color: '#43e97b',
    fontSize: 12,
    fontWeight: '600',
  },
  textOffline: {
    color: '#fa709a',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#43e97b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeOffline: {
    backgroundColor: '#fa709a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
