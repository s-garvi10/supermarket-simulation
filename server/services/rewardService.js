import { query } from '../config/db.js';

export async function getAllRewards() {
  const result = await query('SELECT * FROM rewards ORDER BY points_cost ASC');
  return result.rows.map((row) => ({
    ...row,
    discount: Number(row.discount),
    points_cost: Number(row.points_cost),
    is_active: Boolean(row.is_active),
  }));
}

export async function getRewardById(id) {
  const result = await query('SELECT * FROM rewards WHERE reward_id = $1', [id]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    discount: Number(row.discount),
    points_cost: Number(row.points_cost),
    is_active: Boolean(row.is_active),
  };
}

export async function createReward({ name, points_cost, discount, description, is_active = true }) {
  const rewardId = `rew_${Date.now()}`;
  const result = await query(
    `INSERT INTO rewards (reward_id, name, points_cost, discount, description, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [rewardId, name.trim(), Number(points_cost), Number(discount), description || null, is_active ? 1 : 0]
  );

  const row = result.rows[0];
  return {
    ...row,
    discount: Number(row.discount),
    points_cost: Number(row.points_cost),
    is_active: Boolean(row.is_active),
  };
}

export async function updateReward(id, { name, points_cost, discount, description, is_active }) {
  const result = await query(
    `UPDATE rewards
     SET name = COALESCE($1, name),
         points_cost = COALESCE($2, points_cost),
         discount = COALESCE($3, discount),
         description = COALESCE($4, description),
         is_active = COALESCE($5, is_active)
     WHERE reward_id = $6
     RETURNING *`,
    [
      name ? name.trim() : null,
      points_cost != null ? Number(points_cost) : null,
      discount != null ? Number(discount) : null,
      description !== undefined ? description : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id,
    ]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    discount: Number(row.discount),
    points_cost: Number(row.points_cost),
    is_active: Boolean(row.is_active),
  };
}

export async function toggleRewardStatus(id) {
  const current = await getRewardById(id);
  if (!current) return null;

  const newStatus = !current.is_active;
  const result = await query(
    `UPDATE rewards
     SET is_active = $1
     WHERE reward_id = $2
     RETURNING *`,
    [newStatus ? 1 : 0, id]
  );

  const row = result.rows[0];
  return {
    ...row,
    discount: Number(row.discount),
    points_cost: Number(row.points_cost),
    is_active: Boolean(row.is_active),
  };
}
