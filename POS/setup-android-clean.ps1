# Script de Configuracion Automatica para Compilacion Android
# Ejecuta este script como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuracion Android SDK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Verificar Java JDK
# ============================================
Write-Host "PASO 1: Verificando Java JDK..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "OK - Java esta instalado: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR - Java NO esta instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, descarga e instala Java JDK 17 desde:" -ForegroundColor Yellow
    Write-Host "   https://adoptium.net/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Durante la instalacion, marca: 'Set JAVA_HOME variable'" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Ya instalaste Java? (s/n)"
    if ($continue -ne 's') {
        Write-Host "ERROR - Instala Java y ejecuta este script nuevamente." -ForegroundColor Red
        exit
    }
}

Write-Host ""

# ============================================
# 2. Buscar Android SDK
# ============================================
Write-Host "PASO 2: Buscando Android SDK..." -ForegroundColor Yellow

$possiblePaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk"
)

$androidSdkPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $androidSdkPath = $path
        Write-Host "OK - Android SDK encontrado en: $androidSdkPath" -ForegroundColor Green
        break
    }
}

if (-not $androidSdkPath) {
    Write-Host "AVISO - Android SDK no encontrado automaticamente" -ForegroundColor Yellow
    Write-Host ""
    $customPath = Read-Host "Ingresa la ruta de tu Android SDK (o presiona Enter para usar: $env:LOCALAPPDATA\Android\Sdk)"
    
    if ($customPath) {
        $androidSdkPath = $customPath
    } else {
        $androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
    }
    
    Write-Host "Usando: $androidSdkPath" -ForegroundColor Cyan
}

Write-Host ""

# ============================================
# 3. Configurar Variables de Entorno
# ============================================
Write-Host "PASO 3: Configurando Variables de Entorno..." -ForegroundColor Yellow

# Configurar ANDROID_HOME
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidSdkPath, 'User')
Write-Host "OK - ANDROID_HOME configurado: $androidSdkPath" -ForegroundColor Green

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
        Write-Host "OK - Agregado al PATH: $pathToAdd" -ForegroundColor Green
    } else {
        Write-Host "INFO - Ya existe en PATH: $pathToAdd" -ForegroundColor Gray
    }
}

if ($pathUpdated) {
    [System.Environment]::SetEnvironmentVariable('Path', $currentPath, 'User')
    Write-Host "OK - PATH actualizado" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 4. Actualizar variables en la sesion actual
# ============================================
$env:ANDROID_HOME = $androidSdkPath
$env:Path = $currentPath

Write-Host "PASO 4: Verificando configuracion..." -ForegroundColor Yellow

# Verificar ANDROID_HOME
if ($env:ANDROID_HOME) {
    Write-Host "OK - ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "ERROR - ANDROID_HOME no configurado" -ForegroundColor Red
}

# Verificar ADB
try {
    $adbVersion = adb version 2>&1 | Select-String "Android Debug Bridge"
    Write-Host "OK - ADB disponible: $adbVersion" -ForegroundColor Green
} catch {
    Write-Host "AVISO - ADB no esta disponible todavia (reinicia tu terminal)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# 5. Crear archivo gradle.properties optimizado
# ============================================
Write-Host "PASO 5: Optimizando configuracion de Gradle..." -ForegroundColor Yellow

$gradlePropsPath = "android\gradle.properties"
if (-not (Test-Path "android")) {
    Write-Host "INFO - Carpeta 'android' no existe aun. Se creara despues del prebuild." -ForegroundColor Gray
} else {
    $gradleProps = @"
# Optimizacion de Gradle para compilacion rapida
org.gradle.jvmargs=-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError -XX:+UseParallelGC
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.caching=true
android.enableJetifier=true
android.useAndroidX=true

# Optimizacion adicional
org.gradle.daemon=true
org.gradle.vfs.watch=true
kotlin.incremental=true
"@
    
    Set-Content -Path $gradlePropsPath -Value $gradleProps -Encoding UTF8
    Write-Host "OK - gradle.properties optimizado creado" -ForegroundColor Green
}

Write-Host ""

# ============================================
# RESUMEN
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Cierra esta terminal y abre una NUEVA terminal" -ForegroundColor White
Write-Host "   (para que las variables de entorno se carguen)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Navega al directorio del proyecto:" -ForegroundColor White
Write-Host "   cd C:\Users\Brian\Documents\Rene\POS" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Instala las dependencias:" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Genera las carpetas nativas de Android:" -ForegroundColor White
Write-Host "   npm run prebuild:clean" -ForegroundColor Cyan
Write-Host "   (Esto puede tardar 5-10 minutos)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Compila tu APK:" -ForegroundColor White
Write-Host "   npm run build:debug" -ForegroundColor Cyan
Write-Host ""
Write-Host "El APK estara en:" -ForegroundColor Yellow
Write-Host "   android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Preguntar si quiere continuar
$continuar = Read-Host "Deseas continuar con la instalacion de dependencias ahora? (s/n)"
if ($continuar -eq 's') {
    Write-Host ""
    Write-Host "Instalando dependencias npm..." -ForegroundColor Yellow
    npm install
    Write-Host ""
    Write-Host "OK - Dependencias instaladas" -ForegroundColor Green
    Write-Host ""
    
    $prebuildNow = Read-Host "Deseas ejecutar el prebuild ahora? (Puede tardar 10 minutos) (s/n)"
    if ($prebuildNow -eq 's') {
        Write-Host ""
        Write-Host "Ejecutando prebuild..." -ForegroundColor Yellow
        npm run prebuild:clean
        Write-Host ""
        Write-Host "OK - Prebuild completado" -ForegroundColor Green
        Write-Host ""
        
        $buildNow = Read-Host "Deseas compilar el APK ahora? (s/n)"
        if ($buildNow -eq 's') {
            Write-Host ""
            Write-Host "Compilando APK de debug..." -ForegroundColor Yellow
            npm run build:debug
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "APK COMPILADO EXITOSAMENTE!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Tu APK esta en:" -ForegroundColor Yellow
            Write-Host "   android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
            Write-Host ""
        }
    }
}

Write-Host ""
Write-Host "Tip: Lee GUIA_COMPILACION_APK.md para mas detalles" -ForegroundColor Yellow
Write-Host ""

