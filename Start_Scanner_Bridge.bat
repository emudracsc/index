@echo off
chcp 65001 > nul
title EMUDRA UNIVERSAL SCANNER - Local Bridge Service
cd /d "%~dp0"

echo =====================================================================
echo   ई-मुद्रा युनिव्हर्सल स्कॅनर (EMUDRA SCANNER PRO - LOCAL BRIDGE)
echo   Canon, HP, Epson, Brother हार्डवेअर स्कॅनर स्थानिक सर्व्हिस सुरू करत आहे...
echo =====================================================================
echo.

:: Open scanner.html in default browser after 1 second delay
start "" "%~dp0scanner.html"

:: Run the Python bridge server
python scanner_bridge.py

if errorlevel 1 (
    echo.
    echo [!] सर्व्हिस सुरू करताना त्रुटी आली. संगणकात Python 3 इन्स्टॉल असल्याची खात्री करा.
    pause
)
