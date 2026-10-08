@echo off
:: Iniciar Backend solo si no esta corriendo
netstat -aon | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [BOXER] Iniciando Backend en puerto 8000...
    start "Boxer-Backend" /min cmd /c "cd /d C:\Users\pablo\OneDrive\Escritorio\ventas_boxer\backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
    timeout /t 3 /nobreak >nul
) else (
    echo [BOXER] Backend ya esta corriendo en 8000.
)

:: Iniciar Frontend (React en puerto 3001)
echo [BOXER] Iniciando Frontend en puerto 3001...
cd /d C:\Users\pablo\OneDrive\Escritorio\ventas_boxer\frontend
set PORT=3001
set BROWSER=none
set DANGEROUSLY_DISABLE_HOST_CHECK=true
set WDS_SOCKET_PORT=443
npm start
