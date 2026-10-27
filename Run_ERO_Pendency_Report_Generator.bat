@echo off
title 268-Kankavli ERO Form Pendency Report Generator (BLO, AERO, ERO Login-wise)
cd /d "%~dp0"

echo =====================================================================
echo   २६८ - कणकवली विधानसभा मतदारसंघ : ERO फॉर्म पेंडन्सी अहवाल जनरेटर
echo   (Form 6, 7, 8 : BLO, AERO, ERO Login-wise Pendency Report)
echo   देवगड (1-136), वैभववाडी (137-194), कणकवली (195-332)
echo   ^< 7 दिवस व ^>= 7 दिवस पूर्ण अहवाल
echo =====================================================================
echo.
echo ब्राऊझरमध्ये ERO Pendency Report Generator सुरू करत आहे...
echo.

start "" "%~dp0ero-pendency-report-generator.html"

exit
