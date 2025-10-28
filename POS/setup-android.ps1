# 🚀 Script de Configuración Automática para Compilación Android
# Ejecuta este script como Administrador

Write-Host "🚀 Iniciando configuración para compilación Android..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Verificar Java JDK
# ============================================
Write-Host "📌 PASO 1: Verificando Java JDK..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✅ Java está instalado: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Java NO está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔗 Por favor, descarga e instala Java JDK 17 desde:" -ForegroundColor Yellow
    Write-Host "   https://adoptium.net/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Durante la instalación, marca la opción: 'Set JAVA_HOME variable'" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "¿Ya instalaste Java? (s/n)"
    if ($continue -ne 's') {
        Write-Host "❌ Instala Java y ejecuta este script nuevamente." -ForegroundColor Red
        exit
    }
}

Write-Host ""

# ============================================
# 2. Buscar Android SDK
# ============================================
Write-Host "📌 PASO 2: Buscando Android SDK..." -ForegroundColor Yellow

$possiblePaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk"
)

$androidSdkPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $androidSdkPath = $path
        Write-Host "✅ Android SDK encontrado en: $androidSdkPath" -ForegroundColor Green
        break
    }
}

if (-not $androidSdkPath) {
    Write-Host "⚠️  Android SDK no encontrado automáticamente" -ForegroundColor Yellow
    Write-Host ""
    $customPath = Read-Host "Ingresa la ruta de tu Android SDK (o presiona Enter para usar la ruta por defecto)"
    
    if ($customPath) {
        $androidSdkPath = $customPath
    } else {
        $androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
    }
    
    Write-Host "📍 Usando: $androidSdkPath" -ForegroundColor Cyan
}

Write-Host ""

# ============================================
# 3. Configurar Variables de Entorno
# ============================================
Write-Host "📌 PASO 3: Configurando Variables de Entorno..." -ForegroundColor Yellow

# Configurar ANDROID_HOME
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidSdkPath, 'User')
Write-Host "✅ ANDROID_HOME configurado: $androidSdkPath" -ForegroundColor Green

# Configurar PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$pathsToAdd = @(
    "$androidSdkPath\platform-tools",
    "$androidSdkPath\tools",
    "$androidSdkPath\tools\bin",
    "$androidSdkPath\cmdline-tools\latest\bin"
)

$pathUpdated = $false
foreach ($pathToAdd in $pathsToAdd) {
    if ($currentPath -notlike "*$pathToAdd*") {
        $currentPath += ";$pathToAdd"
        $pathUpdated = $true
        Write-Host "✅ Agregado al PATH: $pathToAdd" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Ya existe en PATH: $pathToAdd" -ForegroundColor Gray
    }
}

if ($pathUpdated) {
    [System.Environment]::SetEnvironmentVariable('Path', $currentPath, 'User')
    Write-Host "✅ PATH actualizado" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 4. Actualizar variables en la sesión actual
# ============================================
$env:ANDROID_HOME = $androidSdkPath
$env:Path = $currentPath

Write-Host "📌 PASO 4: Verificando configuración..." -ForegroundColor Yellow

# Verificar ANDROID_HOME
if ($env:ANDROID_HOME) {
    Write-Host "✅ ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "❌ ANDROID_HOME no configurado" -ForegroundColor Red
}

# Verificar ADB
try {
    $adbVersion = adb version 2>&1 | Select-String "Android Debug Bridge"
    Write-Host "✅ ADB disponible: $adbVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  ADB no está disponible todavía (reinicia tu terminal)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# 5. Crear archivo gradle.properties optimizado
# ============================================
Write-Host "📌 PASO 5: Optimizando configuración de Gradle..." -ForegroundColor Yellow

$gradlePropsPath = "android\gradle.properties"
if (-not (Test-Path "android")) {
    Write-Host "ℹ️  Carpeta 'android' no existe aún. Se creará después del prebuild." -ForegroundColor Gray
} else {
    $gradleProps = @"
# Optimización de Gradle para compilación rápida
org.gradle.jvmargs=-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError -XX:+UseParallelGC
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true
android.enableJetifier=true
android.useAndroidX=true

# Optimización adicional
org.gradle.daemon=true
org.gradle.vfs.watch=true
kotlin.incremental=true
"@
    
    Set-Content -Path $gradlePropsPath -Value $gradleProps -Encoding UTF8
    Write-Host "✅ gradle.properties optimizado creado" -ForegroundColor Green
}

Write-Host ""

# ============================================
# RESUMEN
# ============================================
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Cierra esta terminal y abre una NUEVA terminal" -ForegroundColor White
Write-Host "    (para que las variables de entorno se carguen)" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Navega al directorio del proyecto:" -ForegroundColor White
Write-Host "    cd C:\Users\Brian\Documents\Rene\POS" -ForegroundColor Cyan
Write-Host ""
Write-Host "3️⃣  Instala las dependencias (si no lo has hecho):" -ForegroundColor White
Write-Host "    npm install" -ForegroundColor Cyan
Write-Host ""
Write-Host "4️⃣  Genera las carpetas nativas de Android:" -ForegroundColor White
Write-Host "    npm run prebuild:clean" -ForegroundColor Cyan
Write-Host "    (Esto puede tardar 5-10 minutos)" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Compila tu APK:" -ForegroundColor White
Write-Host "    npm run build:debug" -ForegroundColor Cyan
Write-Host "    (Para versión de prueba)" -ForegroundColor Gray
Write-Host ""
Write-Host "📱 El APK estará en:" -ForegroundColor Yellow
Write-Host "   android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Preguntar si quiere instalar dependencias ahora
$installNow = Read-Host "¿Deseas instalar las dependencias npm ahora? (s/n)"
if ($installNow -eq 's') {
    Write-Host ""
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    Write-Host ""
    
    $prebuildNow = Read-Host "¿Deseas ejecutar el prebuild ahora? (Puede tardar 10 minutos) (s/n)"
    if ($prebuildNow -eq 's') {
        Write-Host ""
        Write-Host "🏗️  Ejecutando prebuild..." -ForegroundColor Yellow
        npm run prebuild:clean
        Write-Host ""
        Write-Host "✅ Prebuild completado" -ForegroundColor Green
        Write-Host ""
        
        $buildNow = Read-Host "¿Deseas compilar el APK ahora? (s/n)"
        if ($buildNow -eq 's') {
            Write-Host ""
            Write-Host "🏗️  Compilando APK de debug..." -ForegroundColor Yellow
            npm run build:debug
            Write-Host ""
            Write-Host "=" * 60 -ForegroundColor Green
            Write-Host "🎉 ¡APK COMPILADO EXITOSAMENTE!" -ForegroundColor Green
            Write-Host "=" * 60 -ForegroundColor Green
            Write-Host ""
            Write-Host "📱 Tu APK está en:" -ForegroundColor Yellow
            Write-Host "   android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
            Write-Host ""
        }
    }
}

Write-Host ""
Write-Host "💡 Tip: Lee GUIA_COMPILACION_APK.md para más detalles" -ForegroundColor Yellow
Write-Host ""

