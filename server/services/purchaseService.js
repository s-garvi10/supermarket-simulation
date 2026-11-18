import { query, getClient, isPostgres } from '../config/db.js';
import { calculateTier } from './membershipService.js';

export async function getAllPurchases() {
  const result = await query('SELECT * FROM purchases ORDER BY purchase_date DESC');
  return result.rows.map((row) => ({
    ...row,
    gross_amount: Number(row.gross_amount),
    discount: Number(row.discount),
    total_amount: Number(row.total_amount),
    points_earned: Number(row.points_earned),
    items: typeof row.items === 'string' ? JSON.parse(row.items || '[]') : (row.items || []),
  }));
}

export async function createPurchase({
  customerId,
  cashierName,
  grossAmount,
  rewardId,
  paymentMethod,
  notes,
  items = [],
}) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    let discount = 0;
    let appliedReward = null;

    // Check reward discount if applied
    if (rewardId) {
      const rewRes = await client.query('SELECT * FROM rewards WHERE reward_id = $1', [rewardId]);
      if (rewRes.rows.length > 0) {
        appliedReward = rewRes.rows[0];
        discount = Math.min(Number(grossAmount), Number(appliedReward.discount));
      }
    }

    const totalAmount = Math.max(0, Number(grossAmount) - discount);
    // Loyalty Rule: 1 point per 10 rupees spent on net total
    const pointsEarned = customerId ? Math.floor(totalAmount / 10) : 0;
    const purchaseId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let customerName = null;
    let customerPhone = null;

    if (customerId) {
      const custRes = await client.query(
        'SELECT name, phone FROM customers WHERE customer_id = $1',
        [customerId]
      );
      if (custRes.rows.length > 0) {
        customerName = custRes.rows[0].name;
        customerPhone = custRes.rows[0].phone;
      }
    }

    // Insert purchase
    const itemsJson = JSON.stringify(items);
    const purchaseSql = `
      INSERT INTO purchases (
        purchase_id, customer_id, customer_name, customer_phone, cashier_name,
        purchase_date, gross_amount, discount, total_amount, points_earned,
        payment_method, reward_id, reward_name, notes, items
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const purchaseParams = [
      purchaseId,
      customerId || null,
      customerName,
      customerPhone,
      cashierName,
      Number(grossAmount),
      discount,
      totalAmount,
      pointsEarned,
      paymentMethod,
      rewardId || null,
      appliedReward ? appliedReward.name : null,
      notes || null,
      itemsJson,
    ];

    const purchaseRes = await client.query(purchaseSql, purchaseParams);
    const purchase = purchaseRes.rows[0];

    // Membership points and reward deductions
    if (customerId) {
      if (appliedReward) {
        // Deduct points for used reward
        await client.query(
          `UPDATE memberships
           SET points = MAX(0, points - $1)
           WHERE customer_id = $2`,
          [Number(appliedReward.points_cost), customerId]
        );

        // Record instant checkout redemption
        const redemptionId = `rdm_${Date.now()}`;
        const voucherCode = `POS-${Math.floor(1000 + Math.random() * 9000)}`;
        await client.query(
          `INSERT INTO redemptions (
             redemption_id, customer_id, reward_id, reward_name, points_spent,
             redeemed_at, voucher_code, status
           ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, 'used')`,
          [
            redemptionId,
            customerId,
            appliedReward.reward_id,
            appliedReward.name,
            Number(appliedReward.points_cost),
            voucherCode,
          ]
        );
      }

      // If SQLite fallback, PostgreSQL triggers aren't running automatically, so update points & tier manually:
      if (!isPostgres()) {
        const memRes = await client.query(
          'SELECT points FROM memberships WHERE customer_id = $1',
          [customerId]
        );
        if (memRes.rows.length > 0) {
          const newPoints = Number(memRes.rows[0].points) + pointsEarned;
          const newTier = calculateTier(newPoints);
          await client.query(
            'UPDATE memberships SET points = $1, tier = $2 WHERE customer_id = $3',
            [newPoints, newTier, customerId]
          );
        }
      }
    }

    await client.query('COMMIT');

    return {
      ...purchase,
      gross_amount: Number(purchase.gross_amount),
      discount: Number(purchase.discount),
      total_amount: Number(purchase.total_amount),
      points_earned: Number(purchase.points_earned),
      items: typeof purchase.items === 'string' ? JSON.parse(purchase.items || '[]') : purchase.items,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
