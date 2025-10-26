import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  code: string;
  sale_price: number;
  stock: number;
  category?: string;
}

interface QRGeneratorProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export function QRGenerator({ visible, product, onClose }: QRGeneratorProps) {
  const [qrSize, setQrSize] = useState(200);
  const [isCapturing, setIsCapturing] = useState(false);
  const qrRef = useRef<any>(null);

  if (!product) return null;

  const qrData = {
    type: 'product',
    id: product.id,
    name: product.name,
    code: product.code,
    price: parseFloat(String(product.sale_price)) || 0,
    stock: parseInt(String(product.stock)) || 0,
    category: product.category || '',
    timestamp: new Date().toISOString(),
  };

  const qrString = JSON.stringify(qrData);

  const captureQR = async (): Promise<string | null> => {
    if (isCapturing) return null;
    
    setIsCapturing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1.0,
      });
      
      if (!uri) {
        throw new Error('No se pudo capturar el código QR');
      }

      return uri;
    } catch (error) {
      console.error('Error capturing QR:', error);
      throw error;
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    try {
      const uri = await captureQR();
      if (!uri) return;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `QR - ${product.name}`,
        UTI: 'public.png',
      });
    } catch (error) {
      console.error('Error sharing QR:', error);
      Alert.alert('Error', 'No se pudo compartir el código QR. Por favor, intenta de nuevo.');
    }
  };

  const handleDownload = async () => {
    try {
      const uri = await captureQR();
      if (!uri) return;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
        return;
      }

      // Usar el diálogo de compartir con opción para guardar
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Guardar QR - ${product.name}`,
        UTI: 'public.png',
      });
    } catch (error) {
      console.error('Error downloading QR:', error);
      Alert.alert('Error', 'No se pudo guardar el código QR. Por favor, intenta de nuevo.');
    }
  };

  const handlePrint = async () => {
    try {
      const uri = await captureQR();
      if (!uri) return;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
        return;
      }

      if (Platform.OS === 'android') {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Imprimir QR - ${product.name}`,
          UTI: 'public.png',
        });
      } else {
        Alert.alert(
          'Imprimir QR',
          'Para imprimir, guarda el QR primero y luego imprímelo desde tu galería de fotos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Guardar', onPress: handleDownload }
          ]
        );
      }
    } catch (error) {
      console.error('Error printing QR:', error);
      Alert.alert('Error', 'No se pudo preparar el código QR para imprimir.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <View style={styles.container}>
          <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
            <LinearGradient
              colors={['rgba(15,12,41,0.98)', 'rgba(48,43,99,0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="qr-code" size={24} color="#f093fb" />
                  </View>
                  <View>
                    <Text style={styles.title}>Código QR</Text>
                    <Text style={styles.subtitle}>{product.name}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.qrContainer}>
                <View style={styles.qrWrapper} ref={qrRef} collapsable={false}>
                  <QRCode
                    value={qrString}
                    size={qrSize}
                    backgroundColor="#fff"
                    color="#000"
                  />
                </View>
                
                <View style={styles.productInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="pricetag" size={16} color="#43e97b" />
                    <Text style={styles.infoText}>${(parseFloat(String(product.sale_price)) || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="cube" size={16} color="#4facfe" />
                    <Text style={styles.infoText}>Stock: {parseInt(String(product.stock)) || 0}</Text>
                  </View>
                  {product.category && (
                    <View style={styles.infoRow}>
                      <Ionicons name="folder" size={16} color="#f093fb" />
                      <Text style={styles.infoText}>{product.category}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.sizeControls}>
                <Text style={styles.sizeLabel}>Tamaño del QR:</Text>
                <View style={styles.sizeButtons}>
                  <TouchableOpacity
                    style={[styles.sizeButton, qrSize === 150 && styles.sizeButtonActive]}
                    onPress={() => setQrSize(150)}
                    disabled={isCapturing}
                  >
                    <Text style={styles.sizeButtonText}>Pequeño</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sizeButton, qrSize === 200 && styles.sizeButtonActive]}
                    onPress={() => setQrSize(200)}
                    disabled={isCapturing}
                  >
                    <Text style={styles.sizeButtonText}>Mediano</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sizeButton, qrSize === 250 && styles.sizeButtonActive]}
                    onPress={() => setQrSize(250)}
                    disabled={isCapturing}
                  >
                    <Text style={styles.sizeButtonText}>Grande</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionButtonsRow1}>
                <TouchableOpacity 
                  style={[styles.actionButton, isCapturing && styles.buttonDisabled]} 
                  onPress={handleShare}
                  disabled={isCapturing}
                >
                  <LinearGradient
                    colors={['#4facfe', '#00f2fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="share" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Compartir</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, isCapturing && styles.buttonDisabled]} 
                  onPress={handleDownload}
                  disabled={isCapturing}
                >
                  <LinearGradient
                    colors={['#43e97b', '#38f9d7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="download" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Descargar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.actionButtonFull, isCapturing && styles.buttonDisabled]} 
                onPress={handlePrint}
                disabled={isCapturing}
              >
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="print" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {isCapturing ? 'Procesando...' : 'Imprimir QR Code'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.instructions}>
                <Ionicons name="information-circle" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.instructionsText}>
                  Los empleados pueden escanear este código para agregar el producto al carrito automáticamente
                </Text>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    width: width * 0.9,
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
  modalBlur: {
    overflow: 'hidden',
    borderRadius: 30,
  },
  modalGradient: {
    padding: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(240,147,251,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  sizeControls: {
    marginBottom: 20,
  },
  sizeLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: 'rgba(240,147,251,0.3)',
    borderColor: '#f093fb',
  },
  sizeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsRow1: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionButtonFull: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  instructionsText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
});