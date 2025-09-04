@echo off
echo 🚀 Iniciando POS Autopartes...
cd backend
start "Backend" python main.py
cd ../frontend
start "Frontend" npm start
echo ✅ Aplicacion iniciada! Se abriran 2 ventanas.
timeout /t 5
start http://localhost:3000
echo 🌐 Navegador abierto en http://localhost:3000
