import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  category?: string;
}

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onProductScanned: (product: Product) => void;
}

export function QRScanner({ visible, onClose, onProductScanned }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashOn, setFlashOn] = useState(false);
  
  // Animaciones
  const scanLineAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (visible) {
      startAnimations();
    } else {
      setScanned(false);
    }
  }, [visible]);

  const startAnimations = () => {
    // Animación de la línea de escaneo
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de pulso
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
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    try {
      const qrData = JSON.parse(data);
      
      // Validar que sea un producto válido
      if (qrData.type === 'product' && qrData.id && qrData.name && qrData.price !== undefined) {
        const product: Product = {
          id: qrData.id,
          name: qrData.name,
          code: qrData.code || '',
          price: parseFloat(qrData.price),
          stock: parseInt(qrData.stock) || 0,
          category: qrData.category || '',
        };
        
        onProductScanned(product);
        onClose();
      } else {
        Alert.alert('QR Inválido', 'Este código QR no contiene información de producto válida');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo leer el código QR. Asegúrate de que sea un código de producto válido.');
      setScanned(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashOn(current => !current);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.permissionContainer}>
            <BlurView intensity={90} tint="dark" style={styles.permissionBlur}>
              <LinearGradient
                colors={['rgba(15,12,41,0.98)', 'rgba(48,43,99,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.permissionGradient}
              >
                <View style={styles.permissionIcon}>
                  <Ionicons name="camera" size={60} color="#f093fb" />
                </View>
                <Text style={styles.permissionTitle}>Permiso de Cámara</Text>
                <Text style={styles.permissionText}>
                  Necesitamos acceso a la cámara para escanear códigos QR de productos
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.permissionButtonGradient}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.permissionButtonText}>Permitir Cámara</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </LinearGradient>
            </BlurView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <CameraView
          style={styles.camera}
          facing={facing}
          flash={flashOn ? 'on' : 'off'}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Overlay con marco de escaneo */}
          <View style={styles.scannerOverlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Escanear Producto</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
                  <Ionicons 
                    name={flashOn ? "flash" : "flash-off"} 
                    size={24} 
                    color={flashOn ? "#f093fb" : "#fff"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleCameraFacing} style={styles.controlButton}>
                  <Ionicons name="camera-reverse" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Marco de escaneo */}
            <View style={styles.scanFrame}>
              <View style={styles.scanArea}>
                {/* Esquinas del marco */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                
                {/* Línea de escaneo animada */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>

            {/* Instrucciones */}
            <View style={styles.instructions}>
              <Animated.View
                style={[
                  styles.instructionIcon,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Ionicons name="qr-code" size={32} color="#f093fb" />
              </Animated.View>
              <Text style={styles.instructionText}>
                Apunta la cámara al código QR del producto
              </Text>
              <Text style={styles.instructionSubtext}>
                El producto se agregará automáticamente al carrito
              </Text>
            </View>

            {/* Footer con controles */}
            <View style={styles.footer}>
              <View style={styles.footerControls}>
                <TouchableOpacity onPress={toggleFlash} style={styles.footerButton}>
                  <Ionicons 
                    name={flashOn ? "flash" : "flash-off"} 
                    size={20} 
                    color={flashOn ? "#f093fb" : "#fff"} 
                  />
                  <Text style={styles.footerButtonText}>
                    {flashOn ? 'Flash ON' : 'Flash OFF'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={toggleCameraFacing} style={styles.footerButton}>
                  <Ionicons name="camera-reverse" size={20} color="#fff" />
                  <Text style={styles.footerButtonText}>Cambiar Cámara</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#f093fb',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#f093fb',
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  instructionIcon: {
    marginBottom: 15,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  instructionSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  footerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  footerButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    minWidth: 100,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  // Estilos para el modal de permisos
  permissionContainer: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: 25,
    overflow: 'hidden',
  },
  permissionBlur: {
    overflow: 'hidden',
    borderRadius: 25,
  },
  permissionGradient: {
    padding: 30,
    alignItems: 'center',
  },
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(240,147,251,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  permissionButton: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  permissionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});
