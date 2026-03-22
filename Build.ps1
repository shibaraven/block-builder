# Block Builder - One-click build script
# Run: Right-click -> Run with PowerShell (as Administrator)

$ErrorActionPreference = "Stop"
$ROOT = "D:\PG\block-builder"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Block Builder - Build Script  " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Kill existing instances
Write-Host "[0/3] Closing existing instances..." -ForegroundColor Yellow
Get-Process "Block Builder" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 500

# Step 1: Build web
Write-Host "[1/3] Building web frontend..." -ForegroundColor Yellow
Set-Location "$ROOT\apps\web"
& pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Web build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Web build OK" -ForegroundColor Green

# Step 2: Build Electron
Write-Host "[2/3] Packaging Electron app..." -ForegroundColor Yellow
Set-Location "$ROOT\apps\desktop"
& npx electron-builder build --win
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Electron build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Electron build OK" -ForegroundColor Green

# Step 3: Launch
Write-Host "[3/3] Launching..." -ForegroundColor Yellow
$exe = "$ROOT\apps\desktop\dist-electron\win-unpacked\Block Builder.exe"
if (Test-Path $exe) {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "  BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "  $exe" -ForegroundColor White
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    & $exe
} else {
    Write-Host "ERROR: exe not found at $exe" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}
