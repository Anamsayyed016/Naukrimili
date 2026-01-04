#!/bin/bash
# Debug script for payment and PDF download issues
# Run this on the server to diagnose payment → PDF download problems

echo "=========================================="
echo "PAYMENT & PDF DOWNLOAD DEBUG SCRIPT"
echo "=========================================="
echo ""

# Set database connection (adjust if needed)
DB_NAME="naukrimili"
DB_USER="postgres"

echo "1. CHECKING RECENT PAYMENTS (Last 10)..."
echo "----------------------------------------"
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  id,
  \"userId\",
  \"planName\",
  \"planType\",
  amount,
  status,
  \"razorpayOrderId\",
  \"razorpayPaymentId\",
  \"createdAt\",
  \"updatedAt\"
FROM \"Payment\"
ORDER BY \"createdAt\" DESC
LIMIT 10;
"

echo ""
echo "2. CHECKING PAYMENTS WITH STATUS 'captured'..."
echo "----------------------------------------"
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  id,
  \"userId\",
  \"planName\",
  \"planType\",
  amount,
  status,
  \"razorpayOrderId\",
  \"razorpayPaymentId\",
  \"createdAt\"
FROM \"Payment\"
WHERE status = 'captured'
ORDER BY \"createdAt\" DESC
LIMIT 10;
"

echo ""
echo "3. CHECKING USER CREDITS FOR USERS WITH CAPTURED PAYMENTS..."
echo "----------------------------------------"
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  uc.id,
  uc.\"userId\",
  uc.\"planName\",
  uc.\"planType\",
  uc.\"isActive\",
  uc.\"pdfDownloads\",
  uc.\"pdfDownloadsLimit\",
  uc.\"resumeDownloads\",
  uc.\"resumeDownloadsLimit\",
  uc.\"validUntil\",
  uc.\"createdAt\",
  uc.\"updatedAt\",
  p.status as payment_status,
  p.\"planName\" as payment_plan
FROM \"UserCredits\" uc
LEFT JOIN \"Payment\" p ON uc.\"userId\" = p.\"userId\" AND p.status = 'captured'
WHERE p.id IS NOT NULL
ORDER BY uc.\"updatedAt\" DESC
LIMIT 10;
"

echo ""
echo "4. CHECKING IF USER CREDITS EXIST FOR RECENT PAYMENTS..."
echo "----------------------------------------"
psql -U $DB_USER -d $DB_NAME -c "
SELECT 
  p.id as payment_id,
  p.\"userId\",
  p.\"planName\" as payment_plan,
  p.status as payment_status,
  p.\"createdAt\" as payment_created,
  CASE 
    WHEN uc.id IS NULL THEN 'NO CREDITS FOUND'
    ELSE 'CREDITS EXIST'
  END as credits_status,
  uc.\"isActive\" as credits_active,
  uc.\"pdfDownloadsLimit\" as pdf_limit,
  uc.\"pdfDownloads\" as pdf_used
FROM \"Payment\" p
LEFT JOIN \"UserCredits\" uc ON p.\"userId\" = uc.\"userId\"
WHERE p.status = 'captured'
  AND p.\"planType\" = 'individual'
ORDER BY p.\"createdAt\" DESC
LIMIT 10;
"

echo ""
echo "5. CHECKING APPLICATION LOGS FOR PAYMENT VERIFICATION..."
echo "----------------------------------------"
echo "Searching for payment verification logs..."
pm2 logs naukrimili --lines 200 --nostream | grep -i "verify payment\|payment verified\|plan activated" | tail -30

echo ""
echo "6. CHECKING APPLICATION LOGS FOR PDF EXPORT ERRORS..."
echo "----------------------------------------"
pm2 logs naukrimili --lines 200 --nostream | grep -i "pdf export\|download\|access check\|requiresPayment" | tail -30

echo ""
echo "7. CHECKING FOR SPECIFIC USER PAYMENTS (Replace USER_ID with actual user ID)..."
echo "----------------------------------------"
echo "To check a specific user, run:"
echo "psql -U $DB_USER -d $DB_NAME -c \"SELECT * FROM \\\"Payment\\\" WHERE \\\"userId\\\" = 'USER_ID' ORDER BY \\\"createdAt\\\" DESC;\""
echo ""
echo "psql -U $DB_USER -d $DB_NAME -c \"SELECT * FROM \\\"UserCredits\\\" WHERE \\\"userId\\\" = 'USER_ID';\""

echo ""
echo "=========================================="
echo "DEBUG SCRIPT COMPLETE"
echo "=========================================="

