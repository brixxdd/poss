# ⚡ INICIO RÁPIDO - Compilar APK

## 🎯 RESUMEN EN 5 PASOS

### 1️⃣ Instalar Java JDK 17
- Descarga: https://adoptium.net/
- ✅ **Marca**: "Set JAVA_HOME variable" durante instalación
- Reinicia tu terminal después

### 2️⃣ Configurar Android Studio
- Abre Android Studio
- Ve a: **File → Settings → Android SDK**
- Instala:
  - ✅ Android 14.0 (API 34)
  - ✅ Android SDK Build-Tools
  - ✅ Android SDK Command-line Tools
  - ✅ Android SDK Platform-Tools

### 3️⃣ Ejecutar Script de Configuración Automática
```powershell
# Abre PowerShell como ADMINISTRADOR
cd C:\Users\Brian\Documents\Rene\POS
.\setup-android.ps1
```
Este script configurará todo automáticamente.

### 4️⃣ Cerrar y Abrir Nueva Terminal
```powershell
# En una NUEVA terminal normal (no administrador):
cd C:\Users\Brian\Documents\Rene\POS
npm install
npm run prebuild:clean
```

### 5️⃣ Compilar APK
```powershell
npm run build:debug
```

**El APK estará en:**
```
android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 📱 Instalar en tu teléfono

### Opción A: Por USB
1. Activa "Depuración USB" en tu teléfono
2. Conecta por USB
3. Ejecuta:
```powershell
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

### Opción B: Transferir archivo
1. Copia el APK a tu teléfono
2. Ábrelo desde el teléfono
3. Acepta instalar desde "Fuentes desconocidas"

---

## 🔄 Compilaciones futuras

Después de cambiar código:
```powershell
npm run build:debug
```
¡Solo eso! Las compilaciones siguientes son mucho más rápidas (2-3 min).

---

## ❓ ¿Problemas?

Lee `GUIA_COMPILACION_APK.md` para solución de problemas detallada.

---

## ⚙️ USO DE GPU

Gradle automáticamente usa tu GPU/CPU al máximo. El archivo `gradle.properties` ya está optimizado para:
- ✅ Compilación paralela (usa todos los núcleos)
- ✅ 4GB RAM para JVM
- ✅ Cache incremental

**Primera compilación:** ~10-15 minutos  
**Compilaciones posteriores:** ~2-5 minutos

---

¡Listo! 🚀

