@echo off
echo.
echo  ================================
echo   DAVEM - Iniciando o site...
echo  ================================
echo.
echo  Site:  http://localhost:4000
echo  Admin: http://localhost:4000/admin
echo  Senha: davem2025
echo.
cd /d "%~dp0"
node server.js
pause
