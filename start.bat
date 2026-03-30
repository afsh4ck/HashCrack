@echo off
title HashCrack
echo.
echo  ==========================================
echo   HashCrack v2.0 - Local Hash Cracker
echo  ==========================================
echo.

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend

:: Start backend in new window
echo Iniciando backend (puerto 8000)...
start "HashCrack Backend" cmd /k "cd /d %BACKEND% && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend in new window
echo Iniciando frontend (puerto 3000)...
start "HashCrack Frontend" cmd /k "cd /d %FRONTEND% && npm run dev"

:: Wait for frontend to start
timeout /t 4 /nobreak > nul

:: Open browser
echo Abriendo navegador...
start http://localhost:3000

echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000
echo  API Docs: http://localhost:8000/docs
echo.
echo  Cierra las ventanas de comandos para detener.
echo.
