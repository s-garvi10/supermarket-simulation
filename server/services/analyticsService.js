import { query, getClient } from '../config/db.js';

export async function getAnalytics() {
  const [revRes, memRes, ptsRes, redRes] = await Promise.all([
    query('SELECT COUNT(*) AS invoice_count, COALESCE(SUM(total_amount), 0) AS total_revenue FROM purchases'),
    query('SELECT COUNT(*) AS total_members FROM memberships'),
    query('SELECT COALESCE(SUM(points_earned), 0) AS total_points FROM purchases'),
    query('SELECT COUNT(*) AS total_redemptions FROM redemptions'),
  ]);

  return {
    totalRevenue: Number(revRes.rows[0]?.total_revenue || 0),
    invoiceCount: Number(revRes.rows[0]?.invoice_count || 0),
    totalMembers: Number(memRes.rows[0]?.total_members || 0),
    totalPointsIssued: Number(ptsRes.rows[0]?.total_points || 0),
    totalRedemptions: Number(redRes.rows[0]?.total_redemptions || 0),
  };
}

export async function resetDatabase() {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM redemptions');
    await client.query('DELETE FROM purchases');
    await client.query("UPDATE memberships SET points = 0, tier = 'Silver'");
    await client.query('COMMIT');
    return { success: true, message: 'All transactions cleared and points reset.' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
