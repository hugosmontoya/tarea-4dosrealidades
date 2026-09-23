@echo off
echo =======================================================
echo Iniciando servidor local para Dos Realidades
echo =======================================================
echo.
echo Abriendo en el navegador: http://localhost:8000/maquiavelo/index.html
echo.
start http://localhost:8000/maquiavelo/index.html
python -m http.server 8000
pause
