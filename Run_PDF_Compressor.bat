@echo off
title EMUDRA PDF COMPRESSOR PRO
cd /d "%~dp0"

echo =====================================================================
echo   EMUDRA PDF COMPRESSOR PRO
echo =====================================================================
echo.

set PY_EXE=

where python >nul 2>nul
if %errorlevel% equ 0 set PY_EXE=python

if not defined PY_EXE where py >nul 2>nul
if not defined PY_EXE if %errorlevel% equ 0 set PY_EXE=py -3

if not defined PY_EXE if exist "%LocalAppData%\Programs\Python\Python315\python.exe" set PY_EXE="%LocalAppData%\Programs\Python\Python315\python.exe"
if not defined PY_EXE if exist "%LocalAppData%\Programs\Python\Python314\python.exe" set PY_EXE="%LocalAppData%\Programs\Python\Python314\python.exe"
if not defined PY_EXE if exist "%LocalAppData%\Programs\Python\Python313\python.exe" set PY_EXE="%LocalAppData%\Programs\Python\Python313\python.exe"
if not defined PY_EXE if exist "%LocalAppData%\Programs\Python\Python312\python.exe" set PY_EXE="%LocalAppData%\Programs\Python\Python312\python.exe"
if not defined PY_EXE if exist "%LocalAppData%\Programs\Python\Python311\python.exe" set PY_EXE="%LocalAppData%\Programs\Python\Python311\python.exe"
if not defined PY_EXE if exist "C:\Program Files\Python315\python.exe" set PY_EXE="C:\Program Files\Python315\python.exe"
if not defined PY_EXE if exist "C:\Program Files\Python314\python.exe" set PY_EXE="C:\Program Files\Python314\python.exe"
if not defined PY_EXE if exist "C:\Program Files\Python313\python.exe" set PY_EXE="C:\Program Files\Python313\python.exe"
if not defined PY_EXE if exist "C:\Program Files\Python312\python.exe" set PY_EXE="C:\Program Files\Python312\python.exe"
if not defined PY_EXE if exist "C:\Program Files\Python311\python.exe" set PY_EXE="C:\Program Files\Python311\python.exe"

if not defined PY_EXE (
    echo [ERROR] Python 3 was not found on this computer.
    echo Please install Python 3 from https://www.python.org/
    pause
    exit /b 1
)

%PY_EXE% pdf_compressor_app.py
if errorlevel 1 (
    echo.
    echo [ERROR] PDF Compressor stopped with an error.
    pause
)
