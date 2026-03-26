@echo off
title HashCrack - Instalador
echo.
echo  ==========================================
echo   HashCrack - Instalacion
echo  ==========================================
echo.

:: Backend
echo [1/3] Instalando dependencias del backend...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias Python.
    echo Asegurate de tener Python 3.10+ instalado.
    pause
    exit /b 1
)

:: Frontend
echo.
echo [2/3] Instalando dependencias del frontend...
cd /d "%~dp0frontend"
npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias Node.js.
    echo Asegurate de tener Node.js 18+ instalado.
    pause
    exit /b 1
)

echo.
echo [3/3] Creando directorios de datos...
cd /d "%~dp0"
if not exist "data\wordlists" mkdir "data\wordlists"
if not exist "data\results"   mkdir "data\results"
if not exist "data\tmp"       mkdir "data\tmp"

echo.
echo  ==========================================
echo   Instalacion completada!
echo   Ejecuta start.bat para iniciar HashCrack
echo  ==========================================
echo.
pause
