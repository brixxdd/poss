# 🔧 Configuración de Cloudinary

## 📝 Pasos para Configurar el Upload Preset

### 1. Accede a tu Dashboard de Cloudinary
- Ve a https://cloudinary.com/console
- Inicia sesión con tu cuenta

### 2. Configura el Upload Preset

1. **Ve a Settings → Upload**
   - Haz clic en "Settings" en el menú lateral
   - Selecciona "Upload" en el submenú

2. **Crea un Upload Preset**
   - Haz clic en "Add upload preset"
   - Configura:
     - **Preset name:** `ml_default`
     - **Signing mode:** `Unsigned` (importante para uso desde la app)
     - **Folder:** `pos-products` (opcional, para organizar)

3. **Configuraciones recomendadas:**
   - **Format:** Auto (f_auto)
   - **Quality:** Auto (q_auto)
   - **Crop:** Fill (c_fill)
   - **Width:** Limit to 1200px
   - **Height:** Limit to 1200px

### 3. Guarda la configuración
- Haz clic en "Save"
- El preset `ml_default` quedará disponible

## ✅ Verificación

Tu cuenta Cloudinary está configurada con:
- **Cloud Name:** `dixdu7cb4`
- **API Key:** `526157387492199`
- **API Secret:** `NWedsvlwnEPmg-iL0CBqS8qwOFo`
- **Upload Preset:** `ml_default` (debes crear este)

## 🎯 Uso en la App

Una vez configurado el preset, podrás:
1. Ir a "Nuevo Producto" o "Editar Producto"
2. Hacer clic en "Subir Imagen"
3. Seleccionar una imagen de tu galería
4. La imagen se subirá automáticamente a Cloudinary
5. Verás la previsualización de la imagen
6. La URL de Cloudinary se guardará en el campo `image_url`

## 🔒 Seguridad

**IMPORTANTE:** En producción, considera:
- Usar signed uploads desde tu backend
- No exponer la API Secret en el código del cliente
- Implementar rate limiting en tu servidor

## 📸 Prueba Rápida

1. Abre la app en Expo Go
2. Ve a Admin → Nuevo Producto
3. Haz clic en "Subir Imagen"
4. Selecciona una imagen de tu galería
5. Espera a que se suba (verás "Subiendo...")
6. ¡Listo! Verás la previsualización
