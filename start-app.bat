@echo off
title POS Autopartes - Startup
color 0A

echo.
echo ========================================
echo    🚀 POS AUTOPARTES - INICIANDO...
echo ========================================
echo.

echo 🔍 Verificando estructura de carpetas...

if not exist "backend\main.py" (
    echo ❌ Error: No se encontro backend\main.py
    echo Asegurate de ejecutar este script desde la carpeta ventas_boxer
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ Error: No se encontro frontend\package.json
    echo Asegurate de ejecutar este script desde la carpeta ventas_boxer
    pause
    exit /b 1
)

echo ✅ Estructura de carpetas correcta

echo.
echo 🔧 Cerrando procesos previos...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo.
echo 🔧 Iniciando Backend (API)...
start "POS Backend" cmd /k "cd backend && python main.py"

echo ⏳ Esperando que el backend se inicie...
timeout /t 5 >nul

echo.
echo 🎨 Iniciando Frontend (React)...
start "POS Frontend" cmd /k "cd frontend && npm start"

echo ⏳ Esperando que el frontend se inicie...
timeout /t 3 >nul

echo.
echo ========================================
echo ✅ POS AUTOPARTES INICIADO CORRECTAMENTE
echo ========================================
echo.
echo 📋 URLs de acceso:
echo    • Frontend: http://localhost:3000
echo    • Backend:  http://localhost:8000
echo.
echo ⚠️  Se abrieron 2 ventanas adicionales
echo ⚠️  NO cierres esas ventanas mientras uses la app
echo.
echo 🌐 Abriendo navegador...

timeout /t 3 >nul
start http://localhost:3000

echo.
echo ✅ Aplicacion lista para usar!
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
