@echo off
chcp 65001 >nul
title Mozilla Firefox Excel Auto Checkbox Extension Setup
cd /d "%~dp0"

echo =====================================================================
echo    ⚡ Excel Auto Checkbox Extension - Mozilla Firefox Setup ⚡
echo    (मोझिला फायरफॉक्स - एक्सेल ऑटो चेकबॉक्स ॲड-ऑन लोड करा)
echo =====================================================================
echo.
echo [1] 'manifest.json' फाईलचा मार्ग आपोआप क्लिपबोर्डवर कॉपी केला आहे...
powershell -Command "Set-Clipboard -Value '%~dp0excel-auto-checkbox-firefox\manifest.json'" >nul 2>&1

echo [2] फायरफॉक्स उघडत आहे: about:debugging#/runtime/this-firefox ...
start firefox "about:debugging#/runtime/this-firefox"

echo [3] एक्स्टेंशन फोल्डर उघडून 'manifest.json' फाईल सिलेक्ट करत आहे...
start explorer /select,"%~dp0excel-auto-checkbox-firefox\manifest.json"

echo.
echo =====================================================================
echo   ✅ एक्स्टेंशन ॲड करण्याच्या २ अत्यंत सोप्या पायऱ्या:
echo =====================================================================
echo.
echo   👉 पायरी १:
echo      फायरफॉक्समध्ये निळ्या रंगाच्या बटणावर क्लिक करा:
echo      [ Load Temporary Add-on... ]
echo.
echo   👉 पायरी २:
echo      उघडलेल्या फाईल विंडोमध्ये 'File name' बॉक्समध्ये थेट
echo      Paste (Ctrl + V) करा आणि 'Open' बटणावर क्लिक करा!
echo      (किंवा हायलाईट झालेली 'manifest.json' फाईल निवडून Open करा)
echo.
echo   ⚠️ महत्त्वाची टीप (IMPORTANT):
echo      - .zip किंवा .xpi फाईल ड्रॅग करू नका किंवा 'Install from file'
echo        करू नका (त्यामुळे 'corrupt' एरर येतो).
echo      - फक्त 'manifest.json' फाईलच निवडा!
echo.
echo   🎉 अभिनंदन! एक्स्टेंशन लगेच ॲड होईल आणि काम करायला लागेल!
echo =====================================================================
echo.
echo [टीप: जर तुम्हाला कायमस्वरूपी (Permanent) हवे असेल तर Chrome मध्ये 
echo       'Open_Auto_Checkbox_Extension.bat' वापरा.]
echo.
pause
