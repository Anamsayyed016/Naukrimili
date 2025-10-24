#!/bin/bash
# Quick fix for npm ci sync issues in CI
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
