@echo off
title Kankavli Election Formula & Supervisor Report Generator
cd /d "%~dp0"

echo =====================================================================
echo   २६८ - कणकवली विधानसभा निवडणूक फॉर्म्युला अहवाल जनरेटर
echo   (Form 6, 7, 8 : देवगड, वैभववाडी, कणकवली तालुकावार व एकत्रित अहवाल)
echo =====================================================================
echo.
echo ब्राऊझरमध्ये Election Report Generator सुरू करत आहे...
echo.

start "" "%~dp0election-report-generator.html"

exit
