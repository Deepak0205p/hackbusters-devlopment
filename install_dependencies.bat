@echo off
setlocal enabledelayedexpansion
title REVEAL 2.0 - Parallel Dependency Installer

:: Get absolute path of repository root
set "REPO_ROOT=%~dp0"
if "%REPO_ROOT:~-1%"=="\" set "REPO_ROOT=%REPO_ROOT:~0,-1%"

cls
echo ========================================================================
echo   REVEAL 2.0: MRPL Sovereign AI Workbench (SIH26117)
echo   PARALLEL DEPENDENCY INSTALLER FOR WINDOWS
echo ========================================================================
echo.
echo Repo Root: %REPO_ROOT%
echo.

:: 1. Verify Prerequisites
echo [*] Checking runtime environment...

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.11 or 3.12 from python.org and add it to PATH.
    pause
    exit /b 1
)

where npm.cmd >nul 2>nul
if %errorlevel% neq 0 (
    where npm >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js / npm is not installed or not in PATH!
        echo Please install Node.js 18 or 20 from nodejs.org.
        pause
        exit /b 1
    ) else (
        set "NPM_CMD=npm"
    )
) else (
    set "NPM_CMD=npm.cmd"
)

echo [OK] Python and Node.js/npm detected.
echo.

:: 2. Create Temporary Coordination Directory
set "FLAG_DIR=%TEMP%\reveal_install_%RANDOM%_%RANDOM%"
mkdir "%FLAG_DIR%" >nul 2>nul

echo ------------------------------------------------------------------------
echo Starting 4 parallel installation workers in separate windows:
echo   [1] Python Backend Requirements   (FastAPI, ChromaDB, Transformers, etc.)
echo   [2] Chat Frontend Dependencies    (Next.js 14, UniverJS, Monaco Editor)
echo   [3] Admin Frontend Dependencies   (Next.js 14, Radix UI, Zustand)
echo   [4] Root Workspace & Prisma       (Prisma CLI, Playwright)
echo ------------------------------------------------------------------------
echo.

:: 3. Launch Workers in Parallel
:: Worker 1: Python Backend
start "Worker 1: Python Backend Dependencies" cmd /c ^
"title [Worker 1/4] Installing Python Backend Dependencies && ^
 echo ========================================================== && ^
 echo [Worker 1/4] Python Backend Dependencies Installation && ^
 echo ========================================================== && ^
 cd /d "%REPO_ROOT%" && ^
 echo Upgrading pip... && ^
 python -m pip install --upgrade pip && ^
 echo. && ^
 echo Installing backend requirements... && ^
 python -m pip install -r "%REPO_ROOT%\requirements.txt" && ^
 (echo OK > "%FLAG_DIR%\python.done" && echo. && echo [Worker 1] Finished successfully! Closing in 4 seconds... && timeout /t 4 >nul) || ^
 (echo FAIL > "%FLAG_DIR%\python.fail" && echo. && echo [Worker 1 ERROR] Python installation failed! && pause)"

:: Worker 2: Chat Frontend
start "Worker 2: Chat Frontend Dependencies" cmd /c ^
"title [Worker 2/4] Installing Chat Frontend (npm) && ^
 echo ========================================================== && ^
 echo [Worker 2/4] Chat Frontend Dependencies (apps/chat-frontend) && ^
 echo ========================================================== && ^
 cd /d "%REPO_ROOT%\apps\chat-frontend" && ^
 %NPM_CMD% install && ^
 (echo OK > "%FLAG_DIR%\chat.done" && echo. && echo [Worker 2] Finished successfully! Closing in 4 seconds... && timeout /t 4 >nul) || ^
 (echo FAIL > "%FLAG_DIR%\chat.fail" && echo. && echo [Worker 2 ERROR] Chat frontend npm install failed! && pause)"

:: Worker 3: Admin Frontend
start "Worker 3: Admin Frontend Dependencies" cmd /c ^
"title [Worker 3/4] Installing Admin Frontend (npm) && ^
 echo ========================================================== && ^
 echo [Worker 3/4] Admin Frontend Dependencies (apps/admin-frontend) && ^
 echo ========================================================== && ^
 cd /d "%REPO_ROOT%\apps\admin-frontend" && ^
 %NPM_CMD% install && ^
 (echo OK > "%FLAG_DIR%\admin.done" && echo. && echo [Worker 3] Finished successfully! Closing in 4 seconds... && timeout /t 4 >nul) || ^
 (echo FAIL > "%FLAG_DIR%\admin.fail" && echo. && echo [Worker 3 ERROR] Admin frontend npm install failed! && pause)"

:: Worker 4: Root Workspace
start "Worker 4: Root Workspace Dependencies" cmd /c ^
"title [Worker 4/4] Installing Root Workspace (npm) && ^
 echo ========================================================== && ^
 echo [Worker 4/4] Root Workspace Dependencies & Prisma && ^
 echo ========================================================== && ^
 cd /d "%REPO_ROOT%" && ^
 %NPM_CMD% install && ^
 (echo OK > "%FLAG_DIR%\root.done" && echo. && echo [Worker 4] Finished successfully! Closing in 4 seconds... && timeout /t 4 >nul) || ^
 (echo FAIL > "%FLAG_DIR%\root.fail" && echo. && echo [Worker 4 ERROR] Root npm install failed! && pause)"

echo [*] All 4 worker processes dispatched in parallel!
echo [*] Monitoring progress...
echo.

:: 4. Monitor Completion Loop
:LOOP
cls
echo ========================================================================
echo   REVEAL 2.0: MRPL Sovereign AI Workbench (SIH26117)
echo   PARALLEL INSTALLATION MONITOR (Auto-updating)
echo ========================================================================
echo.

set "PY_STATUS=[ RUNNING... ]"
if exist "%FLAG_DIR%\python.done" set "PY_STATUS=[ COMPLETED  ]"
if exist "%FLAG_DIR%\python.fail" set "PY_STATUS=[ FAILED     ]"

set "CHAT_STATUS=[ RUNNING... ]"
if exist "%FLAG_DIR%\chat.done" set "CHAT_STATUS=[ COMPLETED  ]"
if exist "%FLAG_DIR%\chat.fail" set "CHAT_STATUS=[ FAILED     ]"

set "ADMIN_STATUS=[ RUNNING... ]"
if exist "%FLAG_DIR%\admin.done" set "ADMIN_STATUS=[ COMPLETED  ]"
if exist "%FLAG_DIR%\admin.fail" set "ADMIN_STATUS=[ FAILED     ]"

set "ROOT_STATUS=[ RUNNING... ]"
if exist "%FLAG_DIR%\root.done" set "ROOT_STATUS=[ COMPLETED  ]"
if exist "%FLAG_DIR%\root.fail" set "ROOT_STATUS=[ FAILED     ]"

echo   Worker 1: Python Backend     : !PY_STATUS!
echo   Worker 2: Chat Frontend      : !CHAT_STATUS!
echo   Worker 3: Admin Frontend     : !ADMIN_STATUS!
echo   Worker 4: Root Workspace     : !ROOT_STATUS!
echo.
echo ------------------------------------------------------------------------
echo Tip: You can switch to individual worker windows to inspect live output.
echo ------------------------------------------------------------------------

:: Check if all 4 are done or failed
set "ALL_DONE=1"
if not exist "%FLAG_DIR%\python.done" if not exist "%FLAG_DIR%\python.fail" set "ALL_DONE=0"
if not exist "%FLAG_DIR%\chat.done"   if not exist "%FLAG_DIR%\chat.fail"   set "ALL_DONE=0"
if not exist "%FLAG_DIR%\admin.done"  if not exist "%FLAG_DIR%\admin.fail"  set "ALL_DONE=0"
if not exist "%FLAG_DIR%\root.done"   if not exist "%FLAG_DIR%\root.fail"   set "ALL_DONE=0"

if "!ALL_DONE!"=="0" (
    timeout /t 3 /nobreak >nul
    goto LOOP
)

:: 5. Summary & Cleanup
echo.
set "HAS_ERROR=0"
if exist "%FLAG_DIR%\python.fail" set "HAS_ERROR=1"
if exist "%FLAG_DIR%\chat.fail"   set "HAS_ERROR=1"
if exist "%FLAG_DIR%\admin.fail"  set "HAS_ERROR=1"
if exist "%FLAG_DIR%\root.fail"   set "HAS_ERROR=1"

rmdir /s /q "%FLAG_DIR%" >nul 2>nul

if "!HAS_ERROR!"=="1" (
    echo ========================================================================
    echo [!] WARNING: One or more parallel installations failed!
    echo Check the worker windows that remained open for error details.
    echo ========================================================================
) else (
    echo ========================================================================
    echo [SUCCESS] ALL DEPENDENCIES SUCCESSFULLY INSTALLED IN PARALLEL!
    echo ========================================================================
    echo.
    echo Next Steps to Run the Sovereign Workbench:
    echo.
    echo   1. Start Local LLM:
    echo      ollama serve
    echo.
    echo   2. Start Python Backend (Port 8000):
    echo      run: start_services.bat (or run manually via uvicorn)
    echo.
    echo   3. Start Public Chat UI (Port 3000):
    echo      cd apps\chat-frontend && npm.cmd run dev:http
    echo.
    echo   4. Start Admin Observatory (Port 3001):
    echo      cd apps\admin-frontend && npm.cmd run dev
    echo.
    echo ========================================================================
)

echo Press any key to exit this installer...
pause >nul
