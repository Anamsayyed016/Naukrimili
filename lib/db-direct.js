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

export async function createPayment(data) {
  try {
    const db = getPool();
    const { userId, razorpayOrderId, planType, planName, amount, currency, expiresAt } = data;
    
    // Validate required fields
    if (!userId || !razorpayOrderId || !planType || !planName || !amount) {
      throw new Error('Missing required payment data fields');
    }
    
    const result = await db.query(
      `INSERT INTO "Payment"
        ("userId", "razorpayOrderId", "planType", "planName", "amount", "currency", "status", "expiresAt", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), NOW())
        RETURNING "razorpayOrderId"`,
      [userId, razorpayOrderId, planType, planName, amount, currency, expiresAt]
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
