@echo off
title POS Autopartes
color 0A

echo.
echo ================================
echo   POS AUTOPARTES - INICIANDO
echo ================================
echo.

echo Cerrando procesos previos...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo Verificando archivos...
if not exist "backend\main.py" (
    echo ERROR: No se encontro backend\main.py
    echo Ejecuta este script desde la carpeta ventas_boxer
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: No se encontro frontend\package.json
    echo Ejecuta este script desde la carpeta ventas_boxer
    pause
    exit /b 1
)

echo Archivos encontrados correctamente
echo.

echo Iniciando Backend...
start "POS Backend" cmd /k "cd backend && echo Backend iniciando... && python main.py"

echo Esperando 3 segundos...
timeout /t 3 >nul

echo Iniciando Frontend...
start "POS Frontend" cmd /k "cd frontend && echo Frontend iniciando... && npm start"

echo Esperando 5 segundos...
timeout /t 5 >nul

echo.
echo ================================
echo   POS AUTOPARTES INICIADO!
echo ================================
echo.
echo URLs de acceso:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo.
echo Se abrieron 2 ventanas adicionales
echo NO cierres esas ventanas mientras uses la app
echo.

echo Abriendo navegador...
start http://localhost:3000

echo.
echo Aplicacion lista para usar!
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
