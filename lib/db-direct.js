import { Pool } from 'pg';

let pool = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function checkPaymentExists(userId, planName) {
  try {
    const db = getPool();
    const result = await db.query(
      `SELECT "razorpayOrderId"
       FROM "Payment"
       WHERE "userId" = $1
         AND "planName" = $2
         AND status = 'pending'
         AND "expiresAt" > NOW()
       LIMIT 1`,
      [userId, planName]
    );
    return result.rows[0] || null;
  } catch (error) {
    // Log detailed error information
    console.error('❌ [DB] Error checking payment:', {
      error: error?.message || error,
      code: error?.code,
      detail: error?.detail,
      constraint: error?.constraint,
      table: error?.table,
      userId,
      planName
    });
    
    // If table doesn't exist, throw error so it can be handled upstream
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      throw new Error(`Payment table not found: ${error?.message || 'Table does not exist'}`);
    }
    
    // For other errors, return null to allow continuation
    return null;
  }
}

export async function findPaymentByOrderId(razorpayOrderId) {
  try {
    const db = getPool();
    const result = await db.query(
      `SELECT 
        id,
        "userId",
        "razorpayOrderId",
        "razorpayPaymentId",
        "razorpaySignature",
        "planType",
        "planName",
        amount,
        currency,
        status,
        "paymentMethod",
        "failureReason",
        metadata,
        "expiresAt",
        "createdAt",
        "updatedAt"
       FROM "Payment"
       WHERE "razorpayOrderId" = $1
       LIMIT 1`,
      [razorpayOrderId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ [DB] Error finding payment:', {
      error: error?.message || error,
      code: error?.code,
      razorpayOrderId
    });
    return null;
  }
}

export async function updatePaymentStatus(paymentId, updateData) {
  try {
    const db = getPool();
    const {
      razorpayPaymentId,
      razorpaySignature,
      status,
      paymentMethod,
      failureReason,
      metadata
    } = updateData;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (razorpayPaymentId !== undefined) {
      updates.push(`"razorpayPaymentId" = $${paramIndex++}`);
      values.push(razorpayPaymentId);
    }
    if (razorpaySignature !== undefined) {
      updates.push(`"razorpaySignature" = $${paramIndex++}`);
      values.push(razorpaySignature);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (paymentMethod !== undefined) {
      updates.push(`"paymentMethod" = $${paramIndex++}`);
      values.push(paymentMethod);
    }
    if (failureReason !== undefined) {
      updates.push(`"failureReason" = $${paramIndex++}`);
      values.push(failureReason);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(metadata));
    }
    
    if (updates.length === 0) {
      return null;
    }
    
    updates.push(`"updatedAt" = NOW()`);
    values.push(paymentId);
    
    const result = await db.query(
      `UPDATE "Payment"
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ [DB] Error updating payment:', {
      error: error?.message || error,
      code: error?.code,
      paymentId
    });
    throw error;
  }
}

export async function findUserCredits(userId) {
  try {
    const db = getPool();
    const result = await db.query(
      `SELECT * FROM "UserCredits" WHERE "userId" = $1 LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ [DB] Error finding user credits:', {
      error: error?.message || error,
      userId
    });
    return null;
  }
}

export async function createOrUpdateUserCredits(userId, creditsData) {
  try {
    const db = getPool();
    const {
      resumeDownloadsLimit,
      aiResumeLimit,
      aiCoverLetterLimit,
      templateAccess,
      atsOptimization,
      pdfDownloadsLimit,
      docxDownloadsLimit,
      validUntil,
      planType,
      planName,
      isActive
    } = creditsData;
    
    // Check if exists
    const existing = await findUserCredits(userId);
    
    if (existing) {
      // Update
      const result = await db.query(
        `UPDATE "UserCredits"
         SET 
           "resumeDownloadsLimit" = $1,
           "aiResumeLimit" = $2,
           "aiCoverLetterLimit" = $3,
           "templateAccess" = $4,
           "atsOptimization" = $5,
           "pdfDownloadsLimit" = $6,
           "docxDownloadsLimit" = $7,
           "validUntil" = $8,
           "planType" = $9,
           "planName" = $10,
           "isActive" = $11,
           "updatedAt" = NOW()
         WHERE "userId" = $12
         RETURNING *`,
        [
          resumeDownloadsLimit,
          aiResumeLimit,
          aiCoverLetterLimit,
          templateAccess,
          atsOptimization,
          pdfDownloadsLimit,
          docxDownloadsLimit,
          validUntil,
          planType,
          planName,
          isActive,
          userId
        ]
      );
      return result.rows[0];
    } else {
      // Create
      const result = await db.query(
        `INSERT INTO "UserCredits"
         ("userId", "resumeDownloadsLimit", "aiResumeLimit", "aiCoverLetterLimit", 
          "templateAccess", "atsOptimization", "pdfDownloadsLimit", "docxDownloadsLimit",
          "validUntil", "planType", "planName", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         RETURNING *`,
        [
          userId,
          resumeDownloadsLimit,
          aiResumeLimit,
          aiCoverLetterLimit,
          templateAccess,
          atsOptimization,
          pdfDownloadsLimit,
          docxDownloadsLimit,
          validUntil,
          planType,
          planName,
          isActive
        ]
      );
      return result.rows[0];
    }
  } catch (error) {
    console.error('❌ [DB] Error creating/updating user credits:', {
      error: error?.message || error,
      userId
    });
    throw error;
  }
}

// Simple CUID generator (compatible with Prisma's cuid format)
function generateCuid() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${random}`;
}

export async function createPayment(data) {
  try {
    const db = getPool();
    const { userId, razorpayOrderId, planType, planName, amount, currency, expiresAt } = data;
    
    // Validate required fields
    if (!userId || !razorpayOrderId || !planType || !planName || !amount) {
      throw new Error('Missing required payment data fields');
    }
    
    // Generate CUID for id field (required by Prisma schema)
    const id = generateCuid();
    
    const result = await db.query(
      `INSERT INTO "Payment"
        ("id", "userId", "razorpayOrderId", "planType", "planName", "amount", "currency", "status", "expiresAt", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW())
        RETURNING "razorpayOrderId"`,
      [id, userId, razorpayOrderId, planType, planName, amount, currency, expiresAt]
    );
    return result.rows[0];
  } catch (error) {
    // Log detailed error information
    console.error('❌ [DB] Error creating payment:', {
      error: error?.message || error,
      code: error?.code,
      detail: error?.detail,
      constraint: error?.constraint,
      table: error?.table,
      data: {
        userId: data?.userId,
        razorpayOrderId: data?.razorpayOrderId,
        planType: data?.planType,
        planName: data?.planName
      }
    });
    
    // Provide more specific error messages
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      throw new Error(`Payment table not found: ${error?.message || 'Table does not exist'}`);
    }
    
    if (error?.code === '23505') { // Unique constraint violation
      throw new Error(`Payment with order ID ${data?.razorpayOrderId} already exists`);
    }
    
    if (error?.code === '23503') { // Foreign key violation
      throw new Error(`Invalid user ID: ${data?.userId}`);
    }
    
    throw error;
  }
}
