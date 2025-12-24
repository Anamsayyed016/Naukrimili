const { Pool } = require('pg');
let pool = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}
async function checkPaymentExists(userId, planName) {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT "razorpayOrderId" FROM "Payment" WHERE "userId" = $1 AND "planName" = $2 AND status = 'pending' AND "expiresAt" > NOW() LIMIT 1`,
      [userId, planName]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error checking payment:', error.message);
    return null;
  }
}
async function createPayment(data) {
  try {
    const pool = getPool();
    const { userId, razorpayOrderId, planType, planName, amount, currency, expiresAt } = data;
    const result = await pool.query(
      `INSERT INTO "Payment" ("userId", "razorpayOrderId", "planType", "planName", "amount", "currency", "status", "expiresAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), NOW()) RETURNING "razorpayOrderId"`,
      [userId, razorpayOrderId, planType, planName, amount, currency, expiresAt]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating payment:', error.message);
    throw error;
  }
}
module.exports = { checkPaymentExists, createPayment };
