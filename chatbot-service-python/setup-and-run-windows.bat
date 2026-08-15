@echo off
setlocal
cd /d "%~dp0"

set "VENV=%LOCALAPPDATA%\CVNS\chatbot-venv"

rem Load the root .env file for local running.
if exist "..\.env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("..\.env") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)

if "%GROQ_API_KEY%"=="" (
  echo ERROR: GROQ_API_KEY is not set.
  echo Set it in Windows Environment Variables for local running.
  exit /b 1
)

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  set "PYTHON_CMD=py -3.12"
) else (
  set "PYTHON_CMD=python"
)

if /I "%~1"=="/reset" (
  echo Resetting the short-path chatbot environment...
  if exist "%VENV%" rmdir /s /q "%VENV%"
)

if not exist "%VENV%\Scripts\python.exe" (
  echo Creating environment at %VENV%...
  %PYTHON_CMD% -m venv "%VENV%"
  if errorlevel 1 exit /b 1
)

call "%VENV%\Scripts\activate.bat"
python -m pip install --upgrade pip setuptools wheel
if errorlevel 1 exit /b 1

python -m pip install --no-cache-dir -r requirements.txt
if errorlevel 1 exit /b 1

python -c "import fastapi, groq, uvicorn; print('Chatbot dependencies installed successfully')"
if errorlevel 1 exit /b 1

echo Starting chatbot at http://127.0.0.1:8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000
