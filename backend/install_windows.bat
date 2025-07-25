@echo off
echo Installing NaukriMili Backend Dependencies for Windows
echo ====================================================

:: Check for Python
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed! Please install Python 3.8 or higher.
    echo Download from: https://www.python.org/downloads/
    exit /b 1
)

:: Check for pip
pip --version > nul 2>&1
if %errorlevel% neq 0 (
    echo pip is not installed!
    exit /b 1
)

:: Install Visual C++ Build Tools
echo Checking for Visual C++ Build Tools...
where cl > nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Visual C++ Build Tools...
    winget install Microsoft.VisualStudio.2022.BuildTools
) else (
    echo Visual C++ Build Tools already installed.
)

:: Install Tesseract OCR
echo Installing Tesseract OCR...
winget install UB-Mannheim.TesseractOCR

:: Add Tesseract to PATH
echo Adding Tesseract to PATH...
setx PATH "%PATH%;C:\Program Files\Tesseract-OCR" /M

:: Create virtual environment
echo Creating virtual environment...
if not exist "venv" (
    python -m venv venv
)

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

:: Install requirements
echo Installing Python dependencies...
pip install -r requirements.txt

:: Verify installations
echo Verifying installations...

echo Checking Tesseract...
tesseract --version > nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Tesseract installation may need manual verification
    echo Please ensure Tesseract is in your PATH: C:\Program Files\Tesseract-OCR
)

echo Checking OpenCV...
python -c "import cv2" > nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: OpenCV installation may need manual verification
)

echo Checking PyMuPDF...
python -c "import fitz" > nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: PyMuPDF installation may need manual verification
)

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    (
        echo TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
        echo MONGODB_URI=mongodb://localhost:27017/naukrimili
        echo JWT_SECRET_KEY=your-secret-key-here
    ) > .env
)

echo.
echo Installation completed!
echo.
echo Next steps:
echo 1. Verify Tesseract installation: tesseract --version
echo 2. Update .env file with your configuration
echo 3. Run tests: pytest tests/
echo.
echo If you encounter any issues, please check INSTALL.md for troubleshooting steps.
echo.

pause
