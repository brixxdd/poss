// Configuración del backend - usar variable de entorno si está disponible
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';