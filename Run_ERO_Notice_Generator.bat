@echo off
title ERO Hearing Notice Generator (Form 13, Form 14, Service Cert & Roznama)
cd /d "%~dp0"

echo =====================================================================
echo   ERO सुनावणी नोटीस जनरेटर (फॉर्म १३, फॉर्म १४, तामिली दाखला व रोजनामा)
echo   Registration of Electors Rules, 1960
echo =====================================================================
echo.
echo ब्राऊझरमध्ये ERO नोटीस जनरेटर सुरू करत आहे...
echo.

start "" "%~dp0ero-hearing-notice-generator.html"

exit
