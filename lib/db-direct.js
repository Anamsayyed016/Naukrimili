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
    console.error('Error checking payment:', error?.message || error);
    return null;
  }
}

export async function createPayment(data) {
  try {
    const db = getPool();
    const { userId, razorpayOrderId, planType, planName, amount, currency, expiresAt } = data;
    const result = await db.query(
      `INSERT INTO "Payment"
        ("userId", "razorpayOrderId", "planType", "planName", "amount", "currency", "status", "expiresAt", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), NOW())
        RETURNING "razorpayOrderId"`,
      [userId, razorpayOrderId, planType, planName, amount, currency, expiresAt]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating payment:', error?.message || error);
    throw error;
  }
}
