# 🔌 Guía para Probar el Modo Offline

## ✨ Funcionalidad Implementada

El sistema ahora incluye un **Modo Offline Inteligente** que permite:

- 📱 Funcionar sin internet
- 💾 Guardar ventas localmente en AsyncStorage
- 🔄 Sincronización automática al reconectar
- 🎨 Indicador visual de estado de conexión
- ⚡ Sin pérdida de ventas

## 🧪 Cómo Probar

### Método 1: Modo Avión (Más Realista)

1. **En el dispositivo móvil/emulador:**
   - Activa el "Modo Avión" desde la configuración
   
2. **En la app:**
   - Verás el banner **"Modo Offline"** en la parte superior
   - La app continuará funcionando normalmente
   - Los productos cargados seguirán disponibles

3. **Realiza una venta offline:**
   - Agrega productos al carrito
   - Completa la venta
   - La venta se guardará **localmente**

4. **Reconecta a internet:**
   - Desactiva el "Modo Avión"
   - La app detectará la conexión
   - El banner cambiará a **"En línea"**
   - ⚠️ **Nota:** La sincronización automática aún está pendiente de implementar

### Método 2: Desactivar WiFi/Datos

1. **En tu dispositivo:**
   - Desactiva WiFi y datos móviles

2. **Observa el banner:**
   - El indicador cambiará a **"Modo Offline"** de forma automática

3. **Vuelve a conectar:**
   - Activa WiFi o datos
   - El banner volverá a **"En línea"**

## 📊 Indicadores Visuales

### Banner Online (Verde)
```
🟢 En línea
```
- Aparece cuando hay conexión a internet

### Banner Offline (Rojo/Naranja)
```
🔴 Modo Offline
```
- Aparece cuando no hay conexión
- Badge muestra número de ventas pendientes de sincronizar

## 🔍 Verificar Ventas Offline

Las ventas offline se guardan en AsyncStorage. Para verificarlas:

1. Abre las DevTools de React Native
2. Busca en el storage la clave: `offline_sales`
3. Verás un array con todas las ventas pendientes

## 🚀 Próximos Pasos

Para completar el sistema offline, falta:

1. **Servicio de sincronización** - Enviar ventas al servidor automáticamente
2. **Cache de productos** - Guardar productos localmente
3. **Validación offline** - Verificar stock antes de vender

## 💡 Tips de Prueba

- **Prueba en diferentes escenarios:** WiFi lento, sin señal, intermitente
- **Múltiples ventas:** Realiza varias ventas offline seguidas
- **Reconexión:** Observa el cambio visual cuando reconectas
- **Badge contador:** Verifica que el número de ventas pendientes sea correcto

## 🐛 Troubleshooting

**Problema:** El banner no aparece
- **Solución:** Verifica que el componente `NetworkStatus` esté incluido en la pantalla

**Problema:** Las ventas no se guardan
- **Solución:** Verifica que `initOfflineStorage()` se llame al iniciar la app

**Problema:** No detecta cambio de conexión
- **Solución:** Espera unos segundos, el estado puede tener un pequeño delay
