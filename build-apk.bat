@echo off
echo ===================================================
echo   DONG GOI CAPACITOR & XUAT APK ANDROID 1835s
echo ===================================================
cd /d "%~dp0"
echo 1. Build ma nguon web toi uu...
call npm run build
echo.
echo 2. Dong bo sang thu muc Android...
call npx cap sync android
echo.
echo 3. Mo du an trong Android Studio de xuat file APK...
call npx cap open android
pause
