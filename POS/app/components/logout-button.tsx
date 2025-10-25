import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAlert, alertHelpers } from './AlertProvider';

export default function LogoutButton() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleLogout = () => {
    alertHelpers.confirmDestructive(
      showAlert,
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder a la aplicación.',
      'Cerrar Sesión',
      async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user');
        
        // Mostrar alerta de éxito
        alertHelpers.success(
          showAlert,
          'Sesión Cerrada',
          'Has cerrado sesión exitosamente. ¡Hasta pronto!',
          () => router.replace('/login')
        );
      }
    );
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={styles.button}>
      <Ionicons name="log-out-outline" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});