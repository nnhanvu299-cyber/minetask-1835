@echo off
chcp 65001 >nul
echo ===================================================
echo   DONG BO & CAP NHAT MINETASK 1835s LEN GITHUB
echo ===================================================
cd /d "%~dp0"

echo 0. Cap nhat ma phien ban tu dong vao version.json...
node -e "const fs=require('fs'); fs.writeFileSync('./public/version.json', JSON.stringify({version: Date.now(), buildTime: new Date().toISOString()}, null, 2));"

echo 1. Build ban cap nhat web moi nhat...
call npm run build

echo.
echo 2. Luu thay doi vao Git va day len nhanh main...
git add -A
git commit -m "update: auto-deploy updates to GitHub %date% %time%"
git push origin main

echo.
echo 3. Day ban build len GitHub Pages (gh-pages)...
call npm run deploy

echo.
echo ===================================================
echo   HOAN TAT! MOI THIET BI SE NHAN DUOC THONG BAO CAP NHAT!
echo ===================================================
pause
