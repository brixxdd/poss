# 🚀 Guía Completa: Compilar APK Localmente con tu GPU

Esta guía te llevará paso a paso para compilar tu aplicación Expo a APK usando los recursos de tu laptop.

---

## ✅ CHECKLIST DE REQUISITOS

### 1. ✅ Android Studio (Ya instalado)
- ✅ Ya lo tienes instalado

### 2. ❌ Java JDK (Necesario instalar)
**Descargar e Instalar:**
1. Ve a: https://adoptium.net/
2. Descarga **Eclipse Temurin JDK 17** (LTS)
3. Ejecuta el instalador
4. ✅ **IMPORTANTE**: Durante la instalación, marca la opción **"Set JAVA_HOME variable"**
5. Reinicia tu terminal después de instalar

**Verificar instalación:**
```powershell
java -version
```
Deberías ver algo como: `openjdk version "17.0.x"`

---

## 🔧 CONFIGURACIÓN DE ANDROID SDK

### 1. Abrir Android Studio
1. Abre Android Studio
2. Ve a: **File → Settings** (o usa `Ctrl + Alt + S`)
3. Navega a: **Appearance & Behavior → System Settings → Android SDK**

### 2. Instalar SDK necesarios
En la pestaña **SDK Platforms**:
- ✅ Marca: **Android 14.0 (API 34)** (o la versión más reciente)
- ✅ Marca: **Android 13.0 (API 33)**
- Click en **"Apply"** para instalar

En la pestaña **SDK Tools**:
- ✅ Marca: **Android SDK Build-Tools**
- ✅ Marca: **Android SDK Command-line Tools**
- ✅ Marca: **Android SDK Platform-Tools**
- ✅ Marca: **Android Emulator** (opcional, si quieres probar en emulador)
- ✅ Marca: **Google Play Services**
- Click en **"Apply"** para instalar

### 3. Tomar nota de la ruta del SDK
En la misma ventana, copia la ruta que aparece en **"Android SDK Location"**
- Ejemplo: `C:\Users\Brian\AppData\Local\Android\Sdk`

---

## 🌍 CONFIGURAR VARIABLES DE ENTORNO

### Opción 1: Usando PowerShell (Recomendado)

Abre PowerShell como **Administrador** y ejecuta estos comandos (reemplaza la ruta con la tuya):

```powershell
# Configurar ANDROID_HOME
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\Brian\AppData\Local\Android\Sdk', 'User')

# Agregar al PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPaths = @(
    "$env:ANDROID_HOME\platform-tools",
    "$env:ANDROID_HOME\tools",
    "$env:ANDROID_HOME\tools\bin"
)
foreach ($path in $newPaths) {
    if ($currentPath -notlike "*$path*") {
        $currentPath += ";$path"
    }
}
[System.Environment]::SetEnvironmentVariable('Path', $currentPath, 'User')

Write-Host "✅ Variables de entorno configuradas. Reinicia tu terminal."
```

### Opción 2: Manualmente
1. Busca "Variables de entorno" en Windows
2. Click en "Editar las variables de entorno del sistema"
3. Click en "Variables de entorno"
4. En "Variables de usuario", click "Nueva":
   - Nombre: `ANDROID_HOME`
   - Valor: `C:\Users\Brian\AppData\Local\Android\Sdk` (tu ruta)
5. Edita la variable "Path", agrega estas 3 líneas:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`
6. Click "Aceptar" en todo
7. **Reinicia tu terminal**

### Verificar configuración:
```powershell
echo $env:ANDROID_HOME
adb version
```

---

## 📦 PREPARAR TU PROYECTO

### 1. Instalar dependencias (si no lo has hecho)
```powershell
cd C:\Users\Brian\Documents\Rene\POS
npm install
```

### 2. Generar carpetas nativas Android
Este comando generará la carpeta `android/` con todo el código nativo:

```powershell
npm run prebuild:clean
```

**Nota**: Este proceso puede tardar 5-10 minutos la primera vez.

---

## 🏗️ COMPILAR EL APK

### Opción A: APK de Debug (más rápido, para pruebas)

```powershell
npm run build:debug
```

El APK estará en:
```
POS\android\app\build\outputs\apk\debug\app-debug.apk
```

### Opción B: APK de Release (optimizado, para distribución)

**Primero necesitas crear un keystore** (solo la primera vez):

```powershell
cd android\app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Te pedirá:
- Contraseña para el keystore (elige una segura y **guárdala**)
- Nombre, organización, etc. (puedes poner lo que quieras)

**Luego configura Gradle** para usar el keystore:

Crea el archivo `POS\android\gradle.properties` y agrega:
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=TU_CONTRASEÑA
MYAPP_RELEASE_KEY_PASSWORD=TU_CONTRASEÑA
```

**⚠️ IMPORTANTE**: Agrega este archivo a `.gitignore` para no subir tus contraseñas a git:
```
android/gradle.properties
android/app/*.keystore
```

**Finalmente, compila:**
```powershell
npm run build:release
```

El APK estará en:
```
POS\android\app\build\outputs\apk\release\app-release.apk
```

---

## 📱 INSTALAR EL APK EN TU DISPOSITIVO

### Método 1: USB (Recomendado)

1. **Activa opciones de desarrollador** en tu teléfono:
   - Ve a Configuración → Acerca del teléfono
   - Toca 7 veces en "Número de compilación"
   - Vuelve atrás → Opciones de desarrollador
   - Activa "Depuración USB"

2. **Conecta tu teléfono** por USB

3. **Verifica la conexión:**
```powershell
adb devices
```
Deberías ver tu dispositivo listado.

4. **Instala el APK:**
```powershell
# Para debug:
adb install android\app\build\outputs\apk\debug\app-debug.apk

# Para release:
npm run install:apk
```

### Método 2: Transferir archivo
1. Copia el APK a tu teléfono (USB, Google Drive, etc.)
2. Abre el APK en tu teléfono
3. Android te pedirá permiso para instalar desde "Fuentes desconocidas"
4. Acepta e instala

---

## 🎯 COMANDOS ÚTILES

```powershell
# Limpiar build anterior
npm run build:clean

# Ver logs del dispositivo conectado
adb logcat | Select-String "POS"

# Generar nuevo prebuild (si cambias plugins o configuración nativa)
npm run prebuild:clean

# Desinstalar app del dispositivo
adb uninstall com.yourcompany.pos
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "SDK location not found"
```powershell
# Verifica que ANDROID_HOME esté configurado
echo $env:ANDROID_HOME

# Si no aparece nada, repite la sección de Variables de Entorno
```

### Error: "Gradle build failed"
```powershell
# Limpia el build y vuelve a intentar
npm run build:clean
npm run build:debug
```

### Error: "Java not found"
```powershell
# Verifica instalación de Java
java -version

# Si no aparece, reinstala Java JDK 17 y reinicia tu terminal
```

### El APK no se instala en el teléfono
- Verifica que el cable USB permita transferencia de datos (no solo carga)
- Asegúrate de haber aceptado la depuración USB en el teléfono
- Prueba con `adb kill-server` y luego `adb start-server`

---

## 📊 USO DE GPU EN COMPILACIÓN

Gradle automáticamente usará los recursos de tu GPU si están disponibles. Para optimizar:

1. Edita `POS\android\gradle.properties` y agrega:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError -XX:+UseParallelGC
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true
android.enableJetifier=true
android.useAndroidX=true
```

2. Esto hará que Gradle:
   - Use hasta 4GB de RAM
   - Compile en paralelo (usando todos tus núcleos CPU/GPU)
   - Use cache para builds más rápidos

---

## ⏱️ TIEMPOS ESTIMADOS

- **Primera compilación**: 10-15 minutos
- **Compilaciones posteriores**: 2-5 minutos (gracias al cache)
- **Tamaño del APK**: ~50-80 MB

---

## ✅ PRÓXIMOS PASOS

Una vez compilado exitosamente:

1. ✅ Prueba el APK en tu dispositivo
2. 🔄 Si haces cambios en el código, solo ejecuta `npm run build:debug` nuevamente
3. 📦 Para distribución, usa siempre `npm run build:release`
4. 🚀 Opcional: Puedes subir el APK a Google Play Console o distribuir directamente

---

¿Tienes alguna pregunta? ¡Avísame! 🚀

