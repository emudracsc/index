@echo off
chcp 65001 >nul
title 📄 PDF मजकूर संपादक (Marathi & English PDF Replacer)
cls
echo ====================================================================
echo   📄 PDF मजकूर संपादक (Find & Replace) - मराठी व इंग्रजी
echo ====================================================================
echo.
echo [1/2] वेब सर्व्हर व इंजिन सुरू होत आहे...

set UV_EXE=%USERPROFILE%\.local\bin\uv.exe

if exist "%UV_EXE%" (
    start http://localhost:8080
    echo [2/2] ब्राउझर उघडला आहे: http://localhost:8080
    "%UV_EXE%" run --with pymupdf --with uharfbuzz --with fonttools python "%~dp0server.py" 8080
) else (
    where uv >nul 2>&1
    if %errorlevel% equ 0 (
        start http://localhost:8080
        echo [2/2] ब्राउझर उघडला आहे: http://localhost:8080
        uv run --with pymupdf --with uharfbuzz --with fonttools python "%~dp0server.py" 8080
    ) else (
        where python >nul 2>&1
        if %errorlevel% equ 0 (
            start http://localhost:8080
            python "%~dp0server.py" 8080
        ) else (
            echo.
            echo [त्रुटी] पायथन किंवा UV सापडले नाही.
            pause
        )
    )
)
