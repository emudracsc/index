@echo off
chcp 65001 >nul
title GitHub Repo Push - Marathi & English PDF Tool
echo ======================================================================
echo 🚀 PDF Tool चे Files तुमच्या GitHub Repo मध्ये Push करत आहे...
echo Target Repo: https://github.com/emudracsc/index.git
echo ======================================================================
echo.

cd /d "%~dp0"

set GIT_CMD="%~dp0tools\mingit\cmd\git.exe"
if not exist %GIT_CMD% (
    set GIT_CMD=git
)

echo [1/5] Git Repository Initialize करत आहे...
%GIT_CMD% init
%GIT_CMD% branch -M main

echo.
echo [2/5] Git User Config करत आहे...
%GIT_CMD% config user.name "emudracsc"
%GIT_CMD% config user.email "emudracsc@users.noreply.github.com"

echo.
echo [3/5] सर्व Files Add आणि Commit करत आहे...
%GIT_CMD% add .
%GIT_CMD% commit -m "Marathi & English PDF Replacer with HarfBuzz Shaping & PDF Merger PRO"

echo.
echo [4/5] Remote URL सेट करत आहे...
%GIT_CMD% remote remove origin >nul 2>&1
%GIT_CMD% remote add origin https://github.com/emudracsc/index.git

echo.
echo [5/5] GitHub वर Push करत आहे...
echo जर तुम्हाला Password किंवा Token विचारले, तर तुमचा GitHub Personal Access Token (PAT) टाका.
echo.
%GIT_CMD% push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo ✅ तुमचे सर्व Files GitHub Repo वर यशस्वीरित्या Push झाले आहेत!
    echo URL: https://github.com/emudracsc/index.git
    echo ======================================================================
) else (
    echo.
    echo ======================================================================
    echo ⚠️ GitHub Authentication आवश्यक आहे!
    echo जर Push झाले नसेल तर तुमचा GitHub Token खालीलप्रमाणे टाका:
    echo https://^<YOUR_TOKEN^>@github.com/emudracsc/index.git
    echo ======================================================================
)

echo.
pause
