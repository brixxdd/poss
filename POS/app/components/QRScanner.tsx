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
  ScrollView,
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
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<string>('');
  
  // Animaciones
  const scanLineAnim = useState(new Animated.Value(0))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const modalAnim = useState(new Animated.Value(0))[0];
  const successAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      startAnimations();
    } else {
      setScanned(false);
      setScannedProduct(null);
      setShowProductModal(false);
      setShowSuccessFeedback(false);
      setLastAddedProduct('');
    }
  }, [visible]);

  useEffect(() => {
    if (showSuccessFeedback) {
      // Animación de entrada
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Ocultar después de 2 segundos
      const timer = setTimeout(() => {
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccessFeedback(false);
          setLastAddedProduct('');
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessFeedback]);

  useEffect(() => {
    if (showProductModal) {
      Animated.spring(modalAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showProductModal]);

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
        
        // Agregar directamente al carrito sin mostrar modal
        onProductScanned(product);
        
        // Mostrar feedback visual
        setLastAddedProduct(product.name);
        setShowSuccessFeedback(true);
        
        // Resetear después de un pequeño delay para permitir escaneo continuo
        setTimeout(() => {
          setScanned(false);
        }, 1000);
      } else {
        Alert.alert('QR Inválido', 'Este código QR no contiene información de producto válida');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo leer el código QR. Asegúrate de que sea un código de producto válido.');
      setScanned(false);
    }
  };

  const handleAddToCart = () => {
    if (scannedProduct) {
      onProductScanned(scannedProduct);
      // Cerrar modal y resetear
      setShowProductModal(false);
      setTimeout(() => {
        setScanned(false);
        setScannedProduct(null);
      }, 300);
    }
  };

  const handleContinueScanning = () => {
    // Cerrar modal y permitir escanear de nuevo
    setShowProductModal(false);
    setTimeout(() => {
      setScanned(false);
      setScannedProduct(null);
    }, 300);
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

  const modalTranslateY = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const modalOpacity = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

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

        {/* Feedback de producto agregado */}
        {showSuccessFeedback && (
          <Animated.View
            style={[
              styles.successFeedback,
              {
                transform: [
                  { 
                    translateY: successAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    })
                  },
                  { 
                    scale: successAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.1, 1],
                    })
                  }
                ],
                opacity: successAnim,
              },
            ]}
          >
            <BlurView intensity={90} tint="dark" style={styles.successFeedbackBlur}>
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successFeedbackGradient}
              >
                <Ionicons name="checkmark-circle" size={32} color="#fff" />
                <Text style={styles.successFeedbackText}>✓ Agregado</Text>
                <Text style={styles.successFeedbackSubtext} numberOfLines={1}>
                  {lastAddedProduct}
                </Text>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        )}

        {/* Modal de detalle del producto - Solo mostrar si hay producto escaneado */}
        {showProductModal && scannedProduct && (
          <Animated.View
            style={[
              styles.productModal,
              {
                transform: [{ translateY: modalTranslateY }],
                opacity: modalOpacity,
              },
            ]}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={handleContinueScanning} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>✅ Producto Escaneado</Text>
              
              <ScrollView 
                contentContainerStyle={styles.modalDetails}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.productInfoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.modalDetailLabel}>Nombre:</Text>
                    <Text style={styles.modalDetailValue}>{scannedProduct.name}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.modalDetailLabel}>Código:</Text>
                    <Text style={styles.modalDetailValue}>{scannedProduct.code}</Text>
                  </View>
                  
                  <View style={[styles.infoRow, styles.priceRow]}>
                    <Text style={styles.modalDetailLabel}>Precio:</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceValue}>${scannedProduct.price.toFixed(2)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.modalDetailLabel}>Stock:</Text>
                    <View style={[
                      styles.stockBadge, 
                      scannedProduct.stock > 10 ? styles.stockGood : styles.stockLow
                    ]}>
                      <Text style={styles.stockText}>{scannedProduct.stock} unidades</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.modalDetailLabel}>Categoría:</Text>
                    <Text style={styles.modalDetailValue}>{scannedProduct.category || 'N/A'}</Text>
                  </View>
                </View>
              </ScrollView>
              
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  onPress={handleContinueScanning} 
                  style={styles.cancelButtonModal}
                >
                  <Text style={styles.cancelButtonTextModal}>Escanear Otro</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleAddToCart} style={styles.addCartButton}>
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addCartButtonGradient}
                  >
                    <Ionicons name="cart" size={20} color="#fff" />
                    <Text style={styles.addCartButtonText}>Agregar al Carrito</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
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
  // Estilos para el modal de detalle del producto
  productModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingTop: 40,
    maxHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalContent: {
    position: 'relative',
  },
  closeModalButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDetails: {
    paddingBottom: 20,
  },
  modalDetailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 5,
  },
  modalDetailValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  addCartButton: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 15,
  },
  addCartButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  addCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  productInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
  },
  infoRow: {
    marginBottom: 15,
  },
  priceRow: {
    marginBottom: 20,
  },
  priceContainer: {
    backgroundColor: 'rgba(240,147,251,0.2)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  priceValue: {
    color: '#f093fb',
    fontSize: 24,
    fontWeight: 'bold',
  },
  stockBadge: {
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  stockGood: {
    backgroundColor: 'rgba(67,233,123,0.2)',
  },
  stockLow: {
    backgroundColor: 'rgba(245,87,108,0.2)',
  },
  stockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelButtonModal: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonTextModal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para feedback de éxito
  successFeedback: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  successFeedbackBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  successFeedbackGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  successFeedbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  successFeedbackSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
    maxWidth: 200,
  },
});
