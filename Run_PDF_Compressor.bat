@echo off
chcp 65001 > nul
title ई-मुद्रा शासकीय PDF व इमेज Compressor Pro (अचूक साईझ)
cd /d "%~dp0"
python pdf_compressor_app.py
if errorlevel 1 (
    echo.
    echo त्रुटी आली. कृपया कॉम्प्युटरमध्ये पायथॉन व्यवस्थित चालू आहे ना ते तपासा.
    pause
)
