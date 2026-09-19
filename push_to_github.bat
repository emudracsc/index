@echo off
chcp 65001 >nul
title GitHub Repo Sync & Push - eMudra CSC Portal
echo ======================================================================
echo 🚀 eMudra CSC Portal & PDF Tools चे सर्व फाइल्स GitHub वर Sync करत आहे...
echo Target Repo: https://github.com/emudracsc/index.git
echo Branch: main
echo ======================================================================
echo.

cd /d "%~dp0"

set GIT_CMD="%~dp0tools\mingit\cmd\git.exe"
if not exist %GIT_CMD% (
    set GIT_CMD=git
)

echo [1/4] Git User तपासत आहे...
%GIT_CMD% config user.name "emudracsc"
%GIT_CMD% config user.email "emudracsc@users.noreply.github.com"

echo.
echo [2/4] नवीन बदल तपासून Add व Commit करत आहे...
%GIT_CMD% add .
%GIT_CMD% diff --cached --quiet
if %errorlevel% neq 0 (
    %GIT_CMD% commit -m "Update portal and tools: %date% %time%"
) else (
    echo स्थानिक बदल आधीच Commit झालेले आहेत.
)

echo.
echo [3/4] GitHub वरून Latest बदल Fetch करत आहे...
%GIT_CMD% fetch origin main

echo.
echo [4/4] GitHub वर Push करत आहे...
echo (जर Browser विंडो किंवा Token विचारले, तर Login / Token टाका)
echo.
%GIT_CMD% push origin main

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo ✅ तुमचे सर्व Files GitHub Repo वर यशस्वीरित्या Sync व Push झाले आहेत!
    echo URL: https://github.com/emudracsc/index.git
    echo ======================================================================
) else (
    echo.
    echo ======================================================================
    echo ⚠️ GitHub Push पूर्ण होऊ शकले नाही!
    echo जर Authentication त्रुटी असेल, तर तुमचा Personal Access Token (PAT) वापरा.
    echo उदाहरणार्थ:
    echo git push https://^<YOUR_GITHUB_TOKEN^>@github.com/emudracsc/index.git main
    echo ======================================================================
)

echo.
pause
