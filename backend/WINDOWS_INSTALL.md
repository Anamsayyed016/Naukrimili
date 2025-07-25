# Windows Installation Guide

## Quick Install

1. Right-click on `install_windows.bat` and select "Run as administrator"
2. Follow the prompts to complete installation
3. Update the `.env` file with your configuration

## Manual Installation Steps

If the automatic installer fails, follow these steps:

### 1. Install System Requirements

```powershell
# Install Visual C++ Build Tools (Run in PowerShell as Administrator)
winget install Microsoft.VisualStudio.2022.BuildTools

# Install Tesseract OCR
winget install UB-Mannheim.TesseractOCR
```

### 2. Add Tesseract to PATH

1. Open System Properties (Win + R, type `sysdm.cpl`)
2. Click "Environment Variables"
3. Under "System Variables", find and select "Path"
4. Click "Edit"
5. Click "New"
6. Add `C:\Program Files\Tesseract-OCR`
7. Click "OK" on all windows

### 3. Set Up Python Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure Environment

Create a `.env` file in the project root:
```env
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
MONGODB_URI=mongodb://localhost:27017/naukrimili
JWT_SECRET_KEY=your-secret-key-here
```

## Verify Installation

```powershell
# Check Tesseract
tesseract --version

# Run Python tests
pytest tests/
```

## Troubleshooting

### Common Issues

1. **Tesseract Not Found**
   ```python
   # In your Python code, set the path explicitly:
   import pytesseract
   pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
   ```

2. **OpenCV Import Error**
   ```powershell
   # Try reinstalling with specific version
   pip uninstall opencv-python
   pip install opencv-python==4.8.0.76
   ```

3. **Python-Magic Issues**
   ```powershell
   # Ensure both packages are installed
   pip install python-magic python-magic-bin
   ```

4. **Visual C++ Build Tools Missing**
   - Download and install from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Select "Desktop development with C++" workload

5. **Permission Errors**
   - Run PowerShell or Command Prompt as Administrator
   - Ensure you have write permissions in the project directory

### Running the Application

1. Start MongoDB:
   ```powershell
   # If using MongoDB Community Server
   net start MongoDB
   ```

2. Activate virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```

3. Run the application:
   ```powershell
   python run.py
   ```

## Development Tools

```powershell
# Format code
black .

# Check types
mypy .

# Run tests
pytest tests/

# Check code style
flake8 .
```

## IDE Setup (VS Code)

1. Install Python extension
2. Set Python interpreter to your virtual environment
3. Add settings to `.vscode/settings.json`:
```json
{
    "python.pythonPath": "venv\\Scripts\\python.exe",
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black"
}
```
