import { query, getClient } from '../config/db.js';

export async function getAllCustomers() {
  const result = await query('SELECT * FROM customers ORDER BY created_at DESC');
  return result.rows;
}

export async function getCustomerById(id) {
  const result = await query('SELECT * FROM customers WHERE customer_id = $1', [id]);
  return result.rows[0] || null;
}

export async function createCustomer(name, email, phone) {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  const cleanEmail = email ? email.trim().toLowerCase() : `${cleanPhone}@loyalty.freshmart.com`;
  const cleanName = name.trim();

  const customerId = `cust_${Date.now()}`;
  const membershipId = `mem_${Date.now()}`;
  const cardNumber = `SM-${Math.floor(100000 + Math.random() * 900000)}`;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const custResult = await client.query(
      `INSERT INTO customers (customer_id, name, email, phone, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [customerId, cleanName, cleanEmail, cleanPhone]
    );

    const memResult = await client.query(
      `INSERT INTO memberships (membership_id, customer_id, card_number, tier, points, joined_on)
       VALUES ($1, $2, $3, 'Silver', 0, CURRENT_TIMESTAMP)
       RETURNING *`,
      [membershipId, customerId, cardNumber]
    );

    await client.query('COMMIT');

    return {
      customer: custResult.rows[0],
      membership: memResult.rows[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateCustomer(id, name, email, phone) {
  const cleanPhone = phone ? phone.trim().replace(/\D/g, '') : null;
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const cleanName = name ? name.trim() : null;

  const result = await query(
    `UPDATE customers
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone)
     WHERE customer_id = $4
     RETURNING *`,
    [cleanName, cleanEmail, cleanPhone, id]
  );

  return result.rows[0] || null;
}
