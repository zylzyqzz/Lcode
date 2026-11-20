@echo off
rem Lcode GUI (p2). Double-click, or run from anywhere. Ctrl+C or close the window stops it.
setlocal
cd /d "%~dp0apps\p2"
if not defined P2_HOST set "P2_HOST=0.0.0.0"
if not defined PORT set "PORT=8788"
if not defined P2_DATA_DIR set "P2_DATA_DIR=%USERPROFILE%\.pi\p2"
rem Open the browser once the server listens (the page retries on its own as well).
start "" /b cmd /c "timeout /t 4 >nul & explorer http://127.0.0.1:%PORT%/"
node --import ./src/source.ts src/hosts/server.ts
echo.
echo p2 stopped. Press any key to close.
pause >nul
