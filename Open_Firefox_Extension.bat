@echo off
chcp 65001 >nul
title Mozilla Firefox Excel Auto Checkbox Extension Setup
echo =====================================================================
echo    Excel Auto Checkbox Extension - Mozilla Firefox Setup
echo    (मोझिला फायरफॉक्स - एक्सेल ऑटो चेकबॉक्स ॲड-ऑन लोड करा)
echo =====================================================================
echo.
echo [1] Firefox उघडत आहे: about:debugging#/runtime/this-firefox ...
start firefox "about:debugging#/runtime/this-firefox"
echo.
echo [2] एक्स्टेंशन फोल्डर उघडत आहे...
start explorer "%~dp0excel-auto-checkbox-firefox"
echo.
echo =====================================================================
echo   ⚠️ महत्त्वाची सूचना (IMPORTANT):
echo   - .xpi फाईलवर थेट डबल-क्लिक करू नका (त्यामुळे 'Not Verified' एरर येतो).
echo.
echo   ✅ योग्य पद्धत (फक्त २ सोप्या पायऱ्या):
echo.
echo   पायरी १: फायरफॉक्समधील निळ्या रंगाच्या बटणावर क्लिक करा:
echo            [ Load Temporary Add-on... ]
echo.
echo   पायरी २: 'excel-auto-checkbox-firefox' फोल्डरमधील
echo            'manifest.json' ही फाईल निवडून Open करा.
echo.
echo   🎉 अभिनंदन! कोणतीही एरर न येता एक्स्टेंशन लगेच चालू होईल!
echo =====================================================================
echo.
pause
