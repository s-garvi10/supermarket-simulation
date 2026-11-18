import { query, getClient, isPostgres } from '../config/db.js';
import { calculateTier } from './membershipService.js';

export async function getAllRedemptions() {
  const result = await query('SELECT * FROM redemptions ORDER BY redeemed_at DESC');
  return result.rows.map((row) => ({
    ...row,
    points_spent: Number(row.points_spent),
  }));
}

export async function createRedemption(customerId, rewardId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch and validate reward
    const rewardRes = await client.query('SELECT * FROM rewards WHERE reward_id = $1', [rewardId]);
    if (rewardRes.rows.length === 0) {
      throw new Error('Reward not found.');
    }
    const reward = rewardRes.rows[0];
    if (!reward.is_active) {
      throw new Error('This reward is currently inactive.');
    }

    // 2. Fetch and lock membership row to prevent race conditions
    const lockClause = isPostgres() ? 'FOR UPDATE' : '';
    const memRes = await client.query(
      `SELECT * FROM memberships WHERE customer_id = $1 ${lockClause}`,
      [customerId]
    );

    if (memRes.rows.length === 0) {
      throw new Error('Loyalty membership record not found for customer.');
    }
    const membership = memRes.rows[0];
    const currentPoints = Number(membership.points);
    const pointsCost = Number(reward.points_cost);

    if (currentPoints < pointsCost) {
      throw new Error(`Insufficient points balance. Required: ${pointsCost}, Available: ${currentPoints}`);
    }

    // 3. Deduct points and recalculate tier
    const remainingPoints = currentPoints - pointsCost;
    const newTier = calculateTier(remainingPoints);

    await client.query(
      'UPDATE memberships SET points = $1, tier = $2 WHERE customer_id = $3',
      [remainingPoints, newTier, customerId]
    );

    // 4. Record voucher redemption
    const redemptionId = `rdm_${Date.now()}`;
    const voucherCode = `FM-RDM-${Math.floor(10000 + Math.random() * 90000)}`;

    const redemptionRes = await client.query(
      `INSERT INTO redemptions (
         redemption_id, customer_id, reward_id, reward_name, points_spent,
         redeemed_at, voucher_code, status
       ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, 'available')
       RETURNING *`,
      [redemptionId, customerId, reward.reward_id, reward.name, pointsCost, voucherCode]
    );

    await client.query('COMMIT');

    const redemption = redemptionRes.rows[0];
    return {
      ...redemption,
      points_spent: Number(redemption.points_spent),
      remaining_points: remainingPoints,
      new_tier: newTier,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
