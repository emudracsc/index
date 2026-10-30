@echo off
title Disposal Report Generator (ERO / AERO Daily Disposal Report)
cd /d "%~dp0"

echo =====================================================================
echo   ERO / AERO दैनिक अहवाल जनरेटर (Disposal Report Generator)
echo   Part-wise Report 2 व Summary Report 3 (A3 Landscape)
echo =====================================================================
echo.
echo ब्राऊझरमध्ये Disposal Report Generator सुरू करत आहे...
echo.

start "" "%~dp0disposal-report-generator.html"

exit
