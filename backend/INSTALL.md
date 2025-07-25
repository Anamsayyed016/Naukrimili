# Dependencies Installation Guide

## System Requirements

### Windows

1. Install Tesseract OCR:
```powershell
winget install UB-Mannheim.TesseractOCR
```
Add Tesseract to your PATH:
- Default location: `C:\Program Files\Tesseract-OCR`

2. Install Visual C++ Build Tools:
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

### Linux (Ubuntu/Debian)

```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y \
    tesseract-ocr \
    libmagic1 \
    python3-dev \
    build-essential \
    libpoppler-cpp-dev \
    pkg-config
```

### macOS

```bash
# Using Homebrew
brew install tesseract
brew install libmagic
```

## Python Dependencies

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Linux/macOS
venv\Scripts\activate     # On Windows
```

2. Install Python packages:
```bash
pip install -r requirements.txt
```

## Verify Installation

Run the test suite to verify everything is installed correctly:
```bash
pytest tests/
```

## Troubleshooting

### Common Issues

1. `pytesseract.pytesseract.TesseractNotFoundError`:
   - Ensure Tesseract is installed
   - Add Tesseract to your PATH
   - Set TESSERACT_CMD environment variable:
     ```python
     import pytesseract
     pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Windows example
     ```

2. `ImportError: failed to find libmagic`:
   - Windows: Ensure python-magic-bin is installed
   - Linux: Install libmagic1
   - macOS: Install libmagic via Homebrew

3. OpenCV Issues:
   - Try installing a specific version:
     ```bash
     pip install opencv-python==4.8.0.76
     ```

4. PDF Processing Issues:
   - Windows: Install poppler:
     ```powershell
     winget install poppler
     ```
   - Add to PATH: `C:\Program Files\poppler\bin`

## Development Setup

1. Install development tools:
```bash
pip install black flake8 mypy pytest
```

2. Set up pre-commit hooks (optional):
```bash
pip install pre-commit
pre-commit install
```

## Environment Variables

Create a `.env` file in the project root:
```env
TESSERACT_PATH=/path/to/tesseract
MAGIC_FILE_PATH=/path/to/magic.mgc  # Only if using custom magic file
```

## Code Quality

Run these before committing:
```bash
black .                 # Code formatting
flake8 .               # Style guide enforcement
mypy .                 # Type checking
pytest tests/          # Run tests
```
