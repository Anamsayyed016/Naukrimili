# Template Image Generation Guide

## Overview

This script generates `thumbnail.png` and `preview.png` images for all resume templates using Puppeteer to render the HTML templates with sample data.

## Prerequisites

1. Install Puppeteer:
```bash
npm install puppeteer --save-dev
```

2. Ensure all template HTML and CSS files exist in `/public/templates/{template-name}/`

## Usage

Run the image generation script:

```bash
node scripts/generate-template-images.js
```

## What It Does

1. Loads each template's `index.html` and `style.css`
2. Injects sample resume data into the HTML
3. Renders the template in a headless browser
4. Generates:
   - `thumbnail.png` (300×400px) for gallery cards
   - `preview.png` (800×1000px) for preview modals

## Generated Images

The script creates images in:
- `/public/templates/modern-professional/thumbnail.png`
- `/public/templates/modern-professional/preview.png`
- `/public/templates/creative-modern/thumbnail.png`
- `/public/templates/creative-modern/preview.png`
- ... (and so on for all 6 templates)

## Customization

To change the sample data used in images, edit the `sampleResumeData` object in `scripts/generate-template-images.js`.

## Troubleshooting

- **Error: Cannot find module 'puppeteer'**
  - Run: `npm install puppeteer --save-dev`

- **Images are blank or incorrect**
  - Check that HTML/CSS files exist and are valid
  - Ensure fonts are loaded (may need to wait longer)
  - Check browser console for errors

- **Images are cut off**
  - Adjust the `clip` dimensions in the screenshot options
  - Ensure template CSS has proper page dimensions

