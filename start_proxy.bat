@echo off
echo ==============================================
echo 🚀 AlemEdu Proxy Server
echo ==============================================
echo.
echo Starting the local proxy server for AlemLLM API...
echo Please KEEP THIS WINDOW OPEN while using the platform locally.
echo.
node proxy.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Proxy stopped unexpectedly. Make sure NodeJS is installed.
)
pause
