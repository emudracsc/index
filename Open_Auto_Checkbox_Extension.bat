@echo off
title Excel Auto Checkbox Extension Setup
echo ========================================================
echo    Excel Auto Checkbox Extension - Chrome Setup
echo    (एक्सेल ऑटो चेकबॉक्स सिलेक्टर - क्रोम सेटअप)
echo ========================================================
echo.
echo [1] Opening Google Chrome Extensions page (chrome://extensions)...
start chrome "chrome://extensions"
echo.
echo [2] Opening extension folder in Explorer...
start explorer "%~dp0excel-auto-checkbox-extension"
echo.
echo ========================================================
echo   STEPS TO INSTALL / लोड करण्याच्या सोप्या पायऱ्या:
echo   1. Turn ON 'Developer mode' (top-right corner)
echo   2. Click 'Load unpacked' (top-left corner)
echo   3. Select folder: excel-auto-checkbox-extension
echo   4. Done! Hover on any table or click extension icon!
echo ========================================================
echo.
pause
