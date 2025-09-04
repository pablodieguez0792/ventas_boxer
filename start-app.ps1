# POS Autopartes - Startup Script
# Este script inicia tanto el backend como el frontend automáticamente

Write-Host "🚀 Iniciando POS Autopartes..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan

# Función para verificar si un puerto está en uso
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Verificar si los puertos están libres
Write-Host "🔍 Verificando puertos..." -ForegroundColor Yellow

if (Test-Port 8000) {
    Write-Host "❌ Puerto 8000 ya está en uso. Cerrando procesos..." -ForegroundColor Red
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

if (Test-Port 3000) {
    Write-Host "❌ Puerto 3000 ya está en uso. Cerrando procesos..." -ForegroundColor Red
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "✅ Puertos libres" -ForegroundColor Green

# Obtener la ruta actual del script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

# Verificar que las carpetas existen
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Error: No se encontró la carpeta backend en $backendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Error: No se encontró la carpeta frontend en $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Carpetas encontradas correctamente" -ForegroundColor Green

# Inicializar variables de jobs
$backendJob = $null
$frontendJob = $null

# Función para iniciar el backend
Write-Host "🔧 Iniciando Backend..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    python main.py
} -ArgumentList $backendPath

# Esperar un momento para que el backend se inicie
Start-Sleep -Seconds 3

# Verificar que el backend se inició correctamente
$backendStarted = $false
$attempts = 0
while (-not $backendStarted -and $attempts -lt 10) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendStarted = $true
            Write-Host "✅ Backend iniciado correctamente en http://localhost:8000" -ForegroundColor Green
        }
    }
    catch {
        $attempts++
        Start-Sleep -Seconds 1
    }
}

if (-not $backendStarted) {
    Write-Host "❌ Error: El backend no se pudo iniciar correctamente" -ForegroundColor Red
    if ($backendJob) {
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -ErrorAction SilentlyContinue
    }
    exit 1
}

# Función para iniciar el frontend
Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm start
} -ArgumentList $frontendPath

# Esperar un momento para que el frontend se inicie
Start-Sleep -Seconds 5

Write-Host "🌐 Frontend iniciándose en http://localhost:3000" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ POS Autopartes iniciado correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs de acceso:" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   • Backend API: http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Para detener la aplicación, presiona Ctrl+C" -ForegroundColor Yellow
Write-Host "⚠️  Mantén esta ventana abierta mientras uses la aplicación" -ForegroundColor Yellow

# Abrir el navegador automáticamente
Start-Process "http://localhost:3000"

# Mantener el script corriendo y mostrar logs
try {
    while ($true) {
        # Verificar que ambos jobs estén corriendo
        if ($backendJob.State -ne "Running") {
            Write-Host "❌ El backend se detuvo inesperadamente" -ForegroundColor Red
            break
        }
        
        if ($frontendJob.State -ne "Running") {
            Write-Host "❌ El frontend se detuvo inesperadamente" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Seconds 5
    }
}
catch {
    Write-Host "🛑 Deteniendo aplicación..." -ForegroundColor Yellow
}
finally {
    # Limpiar jobs al salir
    if ($backendJob) {
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -ErrorAction SilentlyContinue
    }
    if ($frontendJob) {
        Stop-Job $frontendJob -ErrorAction SilentlyContinue
        Remove-Job $frontendJob -ErrorAction SilentlyContinue
    }
    
    Write-Host "🛑 POS Autopartes detenido" -ForegroundColor Red
}
