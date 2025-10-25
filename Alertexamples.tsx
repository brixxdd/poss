// ============================================
// GUÍA DE USO DEL SISTEMA DE ALERTAS PREMIUM
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAlert, alertHelpers } from './AlertProvider';

export default function AlertExamplesScreen() {
  const { showAlert } = useAlert();

  // ========================================
  // EJEMPLO 1: Alerta de Éxito
  // ========================================
  const showSuccessAlert = () => {
    alertHelpers.success(
      showAlert,
      'Producto Agregado',
      'El producto se ha agregado exitosamente al inventario.'
    );
  };

  // ========================================
  // EJEMPLO 2: Alerta de Error
  // ========================================
  const showErrorAlert = () => {
    alertHelpers.error(
      showAlert,
      'Error de Conexión',
      'No se pudo conectar al servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.'
    );
  };

  // ========================================
  // EJEMPLO 3: Alerta de Advertencia
  // ========================================
  const showWarningAlert = () => {
    alertHelpers.warning(
      showAlert,
      'Stock Bajo',
      'El producto "Coca Cola 600ml" tiene solo 5 unidades disponibles. Considera reordenar pronto.'
    );
  };

  // ========================================
  // EJEMPLO 4: Confirmación Simple
  // ========================================
  const showConfirmAlert = () => {
    alertHelpers.confirm(
      showAlert,
      'Confirmar Venta',
      '¿Deseas confirmar la venta por un total de $125.50?',
      () => {
        // Acción al confirmar
        console.log('Venta confirmada');
      },
      () => {
        // Acción al cancelar
        console.log('Venta cancelada');
      }
    );
  };

  // ========================================
  // EJEMPLO 5: Confirmación Destructiva
  // ========================================
  const showDestructiveAlert = () => {
    alertHelpers.confirmDestructive(
      showAlert,
      'Eliminar Producto',
      'Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este producto permanentemente?',
      'Eliminar',
      () => {
        console.log('Producto eliminado');
      }
    );
  };

  // ========================================
  // EJEMPLO 6: Alerta Personalizada Completa
  // ========================================
  const showCustomAlert = () => {
    showAlert({
      title: 'Actualización Disponible',
      message: 'Hay una nueva versión de la aplicación disponible. ¿Deseas actualizar ahora o más tarde?',
      type: 'info',
      icon: 'cloud-download',
      buttons: [
        {
          text: 'Más Tarde',
          style: 'cancel',
          onPress: () => console.log('Actualizar más tarde'),
        },
        {
          text: 'Actualizar',
          style: 'default',
          onPress: () => console.log('Iniciar actualización'),
        },
      ],
    });
  };

  // ========================================
  // EJEMPLO 7: Alerta con Múltiples Acciones
  // ========================================
  const showMultiActionAlert = () => {
    showAlert({
      title: 'Selecciona una Opción',
      message: '¿Cómo deseas proceder con este pedido?',
      type: 'question',
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Guardar',
          style: 'default',
          onPress: () => console.log('Pedido guardado'),
        },
      ],
    });
  };

  // ========================================
  // EJEMPLO 8: Alerta de Éxito con Navegación
  // ========================================
  const showSuccessWithNavigation = () => {
    alertHelpers.success(
      showAlert,
      'Pago Completado',
      'El pago se ha procesado exitosamente. Serás redirigido a la página principal.',
      () => {
        // Navegar después de cerrar la alerta
        // router.push('/home');
        console.log('Navegando a home...');
      }
    );
  };

  // ========================================
  // EJEMPLO 9: Alerta de Error con Retry
  // ========================================
  const showErrorWithRetry = () => {
    showAlert({
      title: 'Error al Guardar',
      message: 'No se pudo guardar la información. ¿Deseas intentar nuevamente?',
      type: 'error',
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Reintentar',
          style: 'default',
          onPress: () => {
            console.log('Reintentando...');
            // Lógica para reintentar
          },
        },
      ],
    });
  };

  // ========================================
  // EJEMPLO 10: Alerta de Validación
  // ========================================
  const showValidationAlert = () => {
    alertHelpers.warning(
      showAlert,
      'Campos Incompletos',
      'Por favor, completa todos los campos requeridos antes de continuar.'
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ejemplos de Alertas Premium</Text>
      
      <TouchableOpacity style={styles.button} onPress={showSuccessAlert}>
        <Text style={styles.buttonText}>1. Alerta de Éxito</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showErrorAlert}>
        <Text style={styles.buttonText}>2. Alerta de Error</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showWarningAlert}>
        <Text style={styles.buttonText}>3. Alerta de Advertencia</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showConfirmAlert}>
        <Text style={styles.buttonText}>4. Confirmación Simple</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showDestructiveAlert}>
        <Text style={styles.buttonText}>5. Confirmación Destructiva</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showCustomAlert}>
        <Text style={styles.buttonText}>6. Alerta Personalizada</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showMultiActionAlert}>
        <Text style={styles.buttonText}>7. Múltiples Acciones</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showSuccessWithNavigation}>
        <Text style={styles.buttonText}>8. Éxito + Navegación</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showErrorWithRetry}>
        <Text style={styles.buttonText}>9. Error con Retry</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={showValidationAlert}>
        <Text style={styles.buttonText}>10. Validación</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f0c29',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'rgba(79,172,254,0.2)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(79,172,254,0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// ============================================
// INTEGRACIÓN EN _layout.tsx o App.tsx
// ============================================
/*
import { AlertProvider } from './AlertProvider';

export default function RootLayout() {
  return (
    <AlertProvider>
      <Stack>
        <Stack.Screen name="index" />
        // ... otras pantallas
      </Stack>
    </AlertProvider>
  );
}
*/

// ============================================
// USO EN CUALQUIER COMPONENTE
// ============================================
/*
import { useAlert, alertHelpers } from './AlertProvider';

function MyComponent() {
  const { showAlert } = useAlert();

  const handleDelete = () => {
    alertHelpers.confirmDestructive(
      showAlert,
      'Eliminar',
      '¿Estás seguro?',
      'Eliminar',
      () => {
        // Acción de eliminación
      }
    );
  };

  return (
    <TouchableOpacity onPress={handleDelete}>
      <Text>Eliminar</Text>
    </TouchableOpacity>
  );
}
*/