import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: CustomAlertButton[];
  icon?: keyof typeof Ionicons.glyphMap;
  type?: 'info' | 'success' | 'warning' | 'error' | 'question';
  onDismiss?: () => void;
}

const alertThemes = {
  info: {
    gradient: ['#4facfe', '#00f2fe'],
    iconColor: '#4facfe',
    icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
  },
  success: {
    gradient: ['#43e97b', '#38f9d7'],
    iconColor: '#43e97b',
    icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
  },
  warning: {
    gradient: ['#fa709a', '#fee140'],
    iconColor: '#fa709a',
    icon: 'warning' as keyof typeof Ionicons.glyphMap,
  },
  error: {
    gradient: ['#ff5858', '#ff1b1b'],
    iconColor: '#ff5858',
    icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
  },
  question: {
    gradient: ['#667eea', '#764ba2'],
    iconColor: '#667eea',
    icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
  },
};

const CustomAlert = ({
  visible,
  title,
  message,
  buttons,
  icon,
  type = 'info',
  onDismiss,
}: CustomAlertProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación del ícono con rebote
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotación del ícono
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }).start();

      // Pulso continuo del ícono
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
    } else {
      // Reset animaciones
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
      iconScaleAnim.setValue(0);
      iconRotateAnim.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  const handleButtonPress = (button: CustomAlertButton) => {
    handleDismiss();
    setTimeout(() => {
      if (button.onPress) button.onPress();
    }, 250);
  };

  const theme = alertThemes[type];
  const iconRotate = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </TouchableWithoutFeedback>

      <View style={styles.container}>
        <TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.alertBox,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                ],
              },
            ]}
          >
            <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
              <LinearGradient
                colors={['rgba(15,12,41,0.98)', 'rgba(48,43,99,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contentGradient}
              >
                {/* Ícono animado */}
                <Animated.View
                  style={[
                    styles.iconContainer,
                    {
                      transform: [
                        { scale: Animated.multiply(iconScaleAnim, pulseAnim) },
                        { rotate: iconRotate },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[...theme.gradient, 'rgba(255,255,255,0.1)'] as [string, string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                  >
                    <Ionicons
                      name={icon || theme.icon}
                      size={50}
                      color="#fff"
                    />
                  </LinearGradient>

                  {/* Anillos decorativos */}
                  <View style={[styles.iconRing, styles.iconRing1]} />
                  <View style={[styles.iconRing, styles.iconRing2]} />
                </Animated.View>

                {/* Título */}
                <Text style={styles.title}>{title}</Text>

                {/* Mensaje */}
                <Text style={styles.message}>{message}</Text>

                {/* Línea decorativa */}
                <LinearGradient
                  colors={theme.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.divider}
                />

                {/* Botones */}
                <View style={styles.buttonsContainer}>
                  {buttons.map((button, index) => {
                    const isDestructive = button.style === 'destructive';
                    const isCancel = button.style === 'cancel';

                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.8}
                        onPress={() => handleButtonPress(button)}
                        style={[
                          styles.button,
                          buttons.length === 1 && styles.buttonSingle,
                        ]}
                      >
                        <LinearGradient
                          colors={
                            isDestructive
                              ? ['#ff5858', '#ff1b1b'] as [string, string]
                              : isCancel
                              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as [string, string]
                              : theme.gradient as [string, string]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.buttonGradient}
                        >
                          <Text
                            style={[
                              styles.buttonText,
                              isCancel && styles.buttonTextCancel,
                            ]}
                          >
                            {button.text}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 30,
  },
  contentGradient: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  iconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  iconRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconRing1: {
    width: 100,
    height: 100,
    borderStyle: 'dashed',
  },
  iconRing2: {
    width: 110,
    height: 110,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 2,
    marginBottom: 24,
    borderRadius: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonSingle: {
    flex: 1,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  buttonTextCancel: {
    color: 'rgba(255,255,255,0.9)',
  },
});

export default CustomAlert;