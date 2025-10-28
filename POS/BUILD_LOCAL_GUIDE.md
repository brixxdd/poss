# Guía de Compilación Local de APK

Esta guía te permite compilar tu aplicación Expo en un APK usando completamente tu laptop, sin usar los servidores de Expo.

## 📋 Requisitos Previos

### 1. Instalar Android Studio
- Descarga desde: https://developer.android.com/studio
- Durante la instalación, asegúrate de instalar:
  - Android SDK
  - Android SDK Platform
  - Android Virtual Device (opcional)

### 2. Instalar Java Development Kit (JDK 17)
- Descarga desde: https://www.oracle.com/java/technologies/downloads/#java17
- O usa OpenJDK: https://adoptium.net/

### 3. Configurar Variables de Entorno (Windows)

Abre PowerShell como Administrador y ejecuta:

```powershell
# Configura ANDROID_HOME (ajusta la ruta según tu instalación)
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\TU_USUARIO\AppData\Local\Android\Sdk', 'User')

# Configura JAVA_HOME (ajusta la ruta según tu instalación)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-17', 'User')

# Agrega al PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPath = "$currentPath;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools;$env:JAVA_HOME\bin"
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
```

**Reinicia tu terminal después de esto.**

### 4. Verificar instalación

```bash
# Verifica Java
java -version

# Verifica Android SDK
adb version
```

## 🚀 Pasos para Compilar

### 1. Instalar EAS CLI Globalmente

```bash
npm install -g eas-cli
```

### 2. Login en Expo (solo la primera vez)

```bash
cd POS
eas login
```

### 3. Configurar el proyecto (ya hecho)

Los archivos `eas.json` y `app.json` ya están configurados.

**IMPORTANTE**: Cambia el package name en `app.json`:
- Abre `app.json`
- Cambia `"package": "com.yourcompany.pos"` a algo único como `"com.tunombre.pos"`

## 🏗️ Métodos de Compilación

### Método 1: Compilación Local Completa (Recomendado)

Este método usa 100% tu máquina:

```bash
cd POS
npx expo prebuild --platform android
```

Esto generará la carpeta `android/` con el proyecto nativo.

Luego compila con:

```bash
cd android
./gradlew assembleRelease
```

El APK estará en: `android/app/build/outputs/apk/release/app-release.apk`

### Método 2: EAS Build Local

Usa EAS CLI pero compila localmente:

```bash
cd POS
eas build --platform android --local
```

**Ventajas**: Maneja todo automáticamente
**Desventajas**: Requiere más espacio en disco

## 📱 Instalar el APK en tu Dispositivo

### Opción A: Via USB (más común)

1. Activa "Modo Desarrollador" en tu Android:
   - Ve a Configuración > Acerca del teléfono
   - Toca "Número de compilación" 7 veces
   - Ve a Configuración > Opciones de desarrollador
   - Activa "Depuración USB"

2. Conecta tu teléfono por USB

3. Instala el APK:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Opción B: Transferencia Manual

1. Copia el archivo APK a tu teléfono
2. Abre el archivo APK desde tu teléfono
3. Permite "Instalar desde fuentes desconocidas" si te lo pide

## 🔧 Troubleshooting

### Error: "ANDROID_HOME not set"
- Verifica que las variables de entorno estén configuradas
- Reinicia tu terminal/IDE

### Error: "SDK location not found"
Crea el archivo `android/local.properties`:
```
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

### Error de Gradle
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Reducir tamaño del APK

En `app.json`, agrega:
```json
"android": {
  "enableProguardInReleaseBuilds": true,
  "enableShrinkResourcesInReleaseBuilds": true
}
```

## 📝 Comandos Rápidos

```bash
# Generar proyecto Android nativo
npx expo prebuild --platform android

# Compilar APK de desarrollo (más rápido)
cd android && ./gradlew assembleDebug

# Compilar APK de producción (optimizado)
cd android && ./gradlew assembleRelease

# Limpiar compilaciones previas
cd android && ./gradlew clean

# Ver dispositivos conectados
adb devices

# Desinstalar app del dispositivo
adb uninstall com.yourcompany.pos
```

## 🎯 Actualizar la App

Cuando hagas cambios:

1. Si cambiaste código JavaScript/TypeScript:
```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

2. Si solo cambiaste configuración:
```bash
cd android
./gradlew assembleRelease
```

## 📦 Scripts Útiles

Agrega estos scripts a tu `package.json`:

```json
"scripts": {
  "android:prebuild": "expo prebuild --platform android",
  "android:clean-prebuild": "expo prebuild --platform android --clean",
  "android:build-debug": "cd android && gradlew assembleDebug",
  "android:build-release": "cd android && gradlew assembleRelease",
  "android:clean": "cd android && gradlew clean",
  "android:install": "adb install android/app/build/outputs/apk/release/app-release.apk"
}
```

Entonces puedes hacer:
```bash
npm run android:prebuild
npm run android:build-release
npm run android:install
```

## 🔒 Firmar el APK (Para publicar en Play Store)

1. Genera un keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Crea `android/gradle.properties`:
```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=tu_password
MYAPP_RELEASE_KEY_PASSWORD=tu_password
```

3. Modifica `android/app/build.gradle` para usar el keystore

## 💡 Notas Importantes

- **Espacio en disco**: Necesitarás ~10-15 GB libres
- **Primera compilación**: Puede tomar 10-30 minutos
- **Compilaciones siguientes**: 2-5 minutos
- **RAM recomendada**: 8GB mínimo, 16GB ideal
- El APK sin firmar funcionará en modo de desarrollo
- Para producción, debes firmar el APK

## 🆚 Diferencias con `npx expo start`

| Aspecto | npx expo start | APK Compilado |
|---------|----------------|---------------|
| Requiere Expo Go | ✅ Sí | ❌ No |
| Actualización en vivo | ✅ Sí | ❌ No |
| Funciona sin conexión | ❌ No | ✅ Sí |
| Incluye código nativo custom | ❌ Limitado | ✅ Sí |
| Tamaño | ~50 MB (Expo Go) | ~30-100 MB |
| Para distribución | ❌ No | ✅ Sí |

¡Listo! Ahora puedes compilar tu app completamente en local. 🎉

