@echo off
echo 開發模式：Block Builder Desktop
echo 確認 pnpm dev 已在另一個終端執行中...
echo.
cd /d D:\PG\block-builder\apps\desktop
set NODE_ENV=development
call pnpm start
