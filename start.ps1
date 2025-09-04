ompleto # POS Autopartes - Script de Inicio Simple
# Ejecuta: .\start.ps1

Write-Host "Iniciando POS Autopartes..." -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Cyan

# Cerrar procesos previos
Write-Host "Cerrando procesos previos..." -ForegroundColor Yellow
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Verificar carpetas
if (-not (Test-Path "backend\main.py")) {
    Write-Host "ERROR: No se encontro backend\main.py" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la carpeta ventas_boxer" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

if (-not (Test-Path "frontend\package.json")) {
    Write-Host "ERROR: No se encontro frontend\package.json" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la carpeta ventas_boxer" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "Carpetas encontradas correctamente" -ForegroundColor Green

# Iniciar Backend
Write-Host "Iniciando Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; python main.py" -WindowStyle Normal

# Esperar un poco
Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host "Iniciando Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start" -WindowStyle Normal

# Esperar un poco más
Start-Sleep -Seconds 5

Write-Host "=========================" -ForegroundColor Cyan
Write-Host "POS Autopartes iniciado!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de acceso:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Se abrieron 2 ventanas adicionales" -ForegroundColor Yellow
Write-Host "NO cierres esas ventanas mientras uses la app" -ForegroundColor Yellow
Write-Host ""

# Abrir navegador
Write-Host "Abriendo navegador..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Aplicacion lista para usar!" -ForegroundColor Green
Write-Host "Presiona Enter para cerrar esta ventana..." -ForegroundColor Gray
Read-Host
