# 🔍 Verificar Configuración de Cloudinary

## ❗ Error 401: Upload Preset No Configurado

Si recibes el error `Request failed with status code 401` al subir imágenes, el problema es que el **Upload Preset `ml_default` no está configurado** o no es **unsigned**.

## 🔧 Solución: Configurar Upload Preset

### Pasos Rápidos:

1. **Ve a https://cloudinary.com/console**
2. **Inicia sesión** con tu cuenta
3. **Ve a Settings → Upload**
4. **Haz clic en "Add upload preset"**
5. **Configura:**
   - **Preset name:** `ml_default`
   - **Signing mode:** ⚠️ DEBE ser `Unsigned` (muy importante)
   - **Folder:** `pos-products`
6. **Guarda**

### ⚠️ Puntos Críticos:

- El preset DEBE ser **Unsigned** (no signed)
- El nombre DEBE ser exactamente: `ml_default`
- Sin configuración de firmas (signing)

## ✅ Verificar Configuración Actual

Ve a: **Settings → Upload** y busca el preset `ml_default`.

Si no existe, créalo siguiendo los pasos de arriba.

## 🔄 Después de Configurar

1. Espera 1-2 minutos para que Cloudinary actualice la configuración
2. Intenta subir una imagen nuevamente desde la app
3. Debería funcionar sin el error 401

## 📞 Nota

Si ya existe el preset pero sigue dando error, es posible que:
- El preset esté configurado como "Signed" (debe ser "Unsigned")
- El nombre del preset sea diferente a `ml_default`
- Necesites esperar unos minutos para que se actualice
