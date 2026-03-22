@echo off
echo.
echo ========================================
echo   Block Builder — 建置桌面執行檔
echo ========================================
echo.

cd /d D:\PG\block-builder

:: Step 1: Build web frontend
echo [1/4] 建置前端...
cd apps\web
call pnpm build
if errorlevel 1 (
  echo [ERROR] 前端建置失敗
  pause & exit /b 1
)
cd ..\..

:: Step 2: Build server
echo [2/4] 建置後端...
cd apps\server
call pnpm build
if errorlevel 1 (
  echo [ERROR] 後端建置失敗
  pause & exit /b 1
)
cd ..\..

:: Step 3: Install desktop deps
echo [3/4] 安裝 Electron 依賴...
cd apps\desktop
call pnpm install
if errorlevel 1 (
  echo [ERROR] Electron 依賴安裝失敗
  pause & exit /b 1
)

:: Step 4: Build Electron
echo [4/4] 打包 Electron 執行檔...
call pnpm build:win
if errorlevel 1 (
  echo [ERROR] Electron 打包失敗
  pause & exit /b 1
)

echo.
echo ========================================
echo   建置完成！
echo   執行檔位置：
echo   D:\PG\block-builder\apps\desktop\dist-electron\
echo ========================================
echo.
pause
