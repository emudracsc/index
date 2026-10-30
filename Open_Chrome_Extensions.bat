@echo off
title Table to Excel Exporter Setup
echo ========================================================
echo    Table to Excel Exporter - Chrome Extension Setup
echo ========================================================
echo.
echo [1] Opening Google Chrome (chrome://extensions)...
start chrome "chrome://extensions"
echo.
echo [2] Opening extension folder in Explorer...
start explorer "%~dp0table-to-excel-extension"
echo.
echo ========================================================
echo   STEPS TO INSTALL / लोड करण्याच्या सोप्या पायऱ्या:
echo   1. Turn ON 'Developer mode' (top-right corner)
echo   2. Click 'Load unpacked' (top-left corner)
echo   3. Select folder: table-to-excel-extension
echo   4. Done! Press Alt+Click on any table to Copy!
echo ========================================================
echo.
pause
