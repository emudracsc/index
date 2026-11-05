@echo off
title Data Operator Attendance Report & Certificate Generator
cd /d "%~dp0"

echo =====================================================================
echo   तहसिलदार कार्यालय कणकवली (निवडणूक शाखा)
echo   डाटा एन्ट्री ऑपरेटर हजेरी पत्रक व दाखला जनरेटर
echo   (ऑटो शनिवार, रविवार व शासकीय सुट्ट्या - A4 Landscape Print & Excel)
echo =====================================================================
echo.
echo ब्राऊझरमध्ये हजेरी पत्रक जनरेटर सुरू करत आहे...
echo.

start "" "%~dp0attendance-report-generator.html"

exit

