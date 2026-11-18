import { query } from '../config/db.js';

export function calculateTier(points) {
  if (points >= 1200) return 'Platinum';
  if (points >= 400) return 'Gold';
  return 'Silver';
}

export async function getAllMemberships() {
  const result = await query('SELECT * FROM memberships ORDER BY joined_on DESC');
  return result.rows;
}

export async function getMembershipByCustomerId(customerId) {
  const result = await query('SELECT * FROM memberships WHERE customer_id = $1', [customerId]);
  return result.rows[0] || null;
}

export async function lookupMember(queryString) {
  if (!queryString || !queryString.trim()) return null;
  const q = queryString.trim();

  // Search by exact card number or phone first
  let result = await query(
    `SELECT c.*, m.membership_id, m.card_number, m.tier, m.points, m.joined_on
     FROM customers c
     JOIN memberships m ON c.customer_id = m.customer_id
     WHERE m.card_number ILIKE $1 OR c.phone ILIKE $1 OR c.email ILIKE $1
     LIMIT 1`,
    [`%${q}%`]
  );

  if (result.rows.length === 0) {
    // Fallback: search by name
    result = await query(
      `SELECT c.*, m.membership_id, m.card_number, m.tier, m.points, m.joined_on
       FROM customers c
       JOIN memberships m ON c.customer_id = m.customer_id
       WHERE c.name ILIKE $1
       LIMIT 1`,
      [`%${q}%`]
    );
  }

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    customer: {
      customer_id: row.customer_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      created_at: row.created_at,
    },
    membership: {
      membership_id: row.membership_id,
      customer_id: row.customer_id,
      card_number: row.card_number,
      tier: row.tier,
      points: row.points,
      joined_on: row.joined_on,
    },
  };
}
