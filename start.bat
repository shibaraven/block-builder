@echo off
title Block Builder
echo.
echo  Block Builder - Starting...
echo.

cd /d "%~dp0"

if not exist "apps\web\node_modules" (
    echo  Installing dependencies...
    call pnpm install
    call pnpm approve-builds
)

if not exist ".env" (
    if exist ".env.example" copy ".env.example" ".env" >nul
)

echo  Starting backend server...
start "Backend" cmd /c "cd /d %~dp0apps\server && pnpm dev & pause"

echo  Starting frontend...
start "Frontend" cmd /c "cd /d %~dp0apps\web && pnpm dev & pause"

echo  Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo  Done! Both windows should be open.
pause
