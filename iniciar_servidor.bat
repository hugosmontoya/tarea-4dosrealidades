@echo off
echo =======================================================
echo Iniciando servidor local para Dos Realidades (Maquiavelo)
echo =======================================================
echo.
echo Abriendo en el navegador: http://localhost:8000/
echo.
start http://localhost:8000/
python -m http.server 8000
pause
