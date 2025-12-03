@echo off
echo Deploying resume autofill fix...
git add .
git commit -m "Add OCR fallback for image-based PDFs and fix AI extraction"
git push origin main --no-verify
echo Done! Now run on server: cd /var/www/naukrimili ^&^& git pull ^&^& npm run build ^&^& pm2 restart naukrimili --update-env
pause

