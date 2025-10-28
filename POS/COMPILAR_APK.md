# 🚀 Compilar APK Local - Inicio Rápido

## ⚡ Pasos Esenciales

### 1️⃣ Instala los Requisitos (Solo una vez)

1. **Android Studio**: https://developer.android.com/studio
2. **JDK 17**: https://adoptium.net/
3. **EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

### 2️⃣ Configura Variables de Entorno (Solo una vez)

Abre PowerShell como Administrador:

```powershell
# Android SDK (ajusta la ruta si instalaste en otro lugar)
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\Brian\AppData\Local\Android\Sdk', 'User')

# Java JDK (ajusta la ruta según donde instalaste)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-17', 'User')

# Agrega al PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPath = "$currentPath;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools;$env:JAVA_HOME\bin"
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
```

**⚠️ Reinicia tu terminal después!**

### 3️⃣ Personaliza el Package Name

Abre `app.json` y cambia:
```json
"package": "com.yourcompany.pos"
```
Por algo único como:
```json
"package": "com.brian.pos"
```

### 4️⃣ Compila tu APK

Opción A - **Método Nativo (Recomendado)**:
```bash
cd POS
npm run prebuild
npm run build:release
```

Tu APK estará en: `android\app\build\outputs\apk\release\app-release.apk`

Opción B - **EAS Build Local**:
```bash
cd POS
npm run build:local
```

### 5️⃣ Instala en tu Teléfono

**Método 1 - USB**:
1. Activa "Depuración USB" en tu Android (Opciones de Desarrollador)
2. Conecta tu teléfono
3. Ejecuta:
   ```bash
   npm run install:apk
   ```

**Método 2 - Manual**:
1. Copia el archivo APK a tu teléfono
2. Ábrelo desde el explorador de archivos
3. Instala (permite "Fuentes desconocidas" si pide)

## 🔄 Para Actualizar la App

```bash
npm run prebuild:clean
npm run build:release
```

## 📋 Comandos Disponibles

```bash
npm run prebuild          # Genera proyecto Android nativo
npm run prebuild:clean    # Regenera desde cero
npm run build:debug       # APK de desarrollo (rápido)
npm run build:release     # APK de producción (optimizado)
npm run build:clean       # Limpia compilaciones anteriores
npm run install:apk       # Instala APK via USB
npm run build:local       # EAS Build local
```

## 🐛 Problemas Comunes

### "ANDROID_HOME not set"
- Verifica las variables de entorno
- Reinicia tu terminal/VSCode

### "SDK location not found"
Crea `android/local.properties`:
```
sdk.dir=C:\\Users\\Brian\\AppData\\Local\\Android\\Sdk
```

### Errores de Gradle
```bash
npm run build:clean
npm run build:release
```

## 📖 Documentación Completa

Lee `BUILD_LOCAL_GUIDE.md` para más detalles y opciones avanzadas.

## ✅ Diferencias Clave

| `npx expo start` | APK Compilado |
|------------------|---------------|
| Necesita Expo Go | App standalone |
| Desarrollo rápido | Para distribución |
| Hot reload | App completa |
| ~50MB (Expo Go) | 30-100MB optimizado |

---

**¡Eso es todo!** Ahora tienes tu app compilada 100% local sin usar servidores de Expo. 🎉

