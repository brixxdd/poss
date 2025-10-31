import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomAlert from '../CustomAlert';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error' | 'question';
  icon?: keyof typeof Ionicons.glyphMap;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertConfig, setAlertConfig] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'info',
  });

  const showAlert = (options: AlertOptions) => {
    setAlertConfig({
      ...options,
      visible: true,
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons || []}
        type={alertConfig.type}
        icon={alertConfig.icon}
        onDismiss={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe ser usado dentro de un AlertProvider');
  }
  return context;
};

// ============================================
// HELPERS MEJORADOS - Más flexibles y fáciles de usar
// ============================================

export const alertHelpers = {
  /**
   * Alerta de información
   */
  info: (showAlert: (options: AlertOptions) => void, title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK', onPress }],
    });
  },

  /**
   * Alerta de éxito
   */
  success: (showAlert: (options: AlertOptions) => void, title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'Genial!', onPress }],
    });
  },

  /**
   * Alerta de advertencia
   */
  warning: (showAlert: (options: AlertOptions) => void, title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'Entendido', onPress }],
    });
  },

  /**
   * Alerta de error
   */
  error: (showAlert: (options: AlertOptions) => void, title: string, message: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'Cerrar', onPress }],
    });
  },

  /**
   * Confirmación simple
   */
  confirm: (
    showAlert: (options: AlertOptions) => void,
    title: string,
    message: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ) => {
    showAlert({
      title,
      message,
      type: 'question',
      buttons: [
        { text: cancelText, style: 'cancel', onPress: onCancel },
        { text: confirmText, style: 'default', onPress: onConfirm },
      ],
    });
  },

  /**
   * Confirmación destructiva (eliminar, cerrar sesión, etc)
   */
  confirmDestructive: (
    showAlert: (options: AlertOptions) => void,
    title: string,
    message: string,
    confirmText: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    cancelText: string = 'Cancelar'
  ) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [
        { text: cancelText, style: 'cancel', onPress: onCancel },
        { text: confirmText, style: 'destructive', onPress: onConfirm },
      ],
    });
  },
};

// ============================================
// EXPORTS ADICIONALES para compatibilidad
// ============================================

// Export del tipo para usar en componentes
export type { AlertOptions, CustomAlertButton, AlertContextType };