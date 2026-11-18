-- ============================================================================
-- Supermarket DBMS - Seed Initial Data
-- ============================================================================

-- Customers
INSERT INTO customers (customer_id, name, email, phone, created_at) VALUES
('cust_1', 'Rahul Sharma', 'rahul.sharma@example.com', '98xxxxxxxx', '2026-04-12 10:15:00+00'),
('cust_2', 'Priya Patel', 'priya.patel@example.com', '90xxxxxxx', '2025-11-05 14:30:00+00'),
('cust_3', 'Amit Kumar', 'amit.k@example.com', '97xxxxxxx', '2026-09-18 09:20:00+00'),
('cust_4', 'Ananya Iyer', 'ananya.i@example.com', '96xxxxxxx', '2026-10-10 16:45:00+00')
ON CONFLICT (customer_id) DO NOTHING;

-- Memberships
INSERT INTO memberships (membership_id, customer_id, card_number, tier, points, joined_on) VALUES
('mem_1', 'cust_1', 'SM-849201', 'Gold', 620, '2026-04-12 10:15:00+00'),
('mem_2', 'cust_2', 'SM-902184', 'Platinum', 1850, '2025-11-05 14:30:00+00'),
('mem_3', 'cust_3', 'SM-114920', 'Silver', 85, '2026-09-18 09:20:00+00'),
('mem_4', 'cust_4', 'SM-304912', 'Silver', 140, '2026-10-10 16:45:00+00')
ON CONFLICT (membership_id) DO NOTHING;

-- Rewards (Value: 1 point = ₹0.25 redemption value)
INSERT INTO rewards (reward_id, name, points_cost, discount, description, is_active) VALUES
('rew_1', '₹25 Bill Discount Voucher', 100, 25.00, 'Instant ₹25 deduction applicable on your supermarket bill (100 pts @ ₹0.25/pt).', true),
('rew_2', '₹50 Fresh Groceries Voucher', 200, 50.00, 'Get ₹50 off your grocery basket at checkout (200 pts @ ₹0.25/pt).', true),
('rew_3', '₹100 Gourmet Shopping Pass', 400, 100.00, 'Special ₹100 discount for loyal supermarket shoppers (400 pts @ ₹0.25/pt).', true),
('rew_4', '₹200 Super Saver Voucher', 800, 200.00, 'Save ₹200 on your overall supermarket purchase (800 pts @ ₹0.25/pt).', true),
('rew_5', '₹500 Mega Festive Coupon', 2000, 500.00, '₹500 direct rebate on pantry & staples checkout (2000 pts @ ₹0.25/pt).', true)
ON CONFLICT (reward_id) DO UPDATE SET
  name = EXCLUDED.name,
  points_cost = EXCLUDED.points_cost,
  discount = EXCLUDED.discount,
  description = EXCLUDED.description;

-- Sample Purchases
INSERT INTO purchases (purchase_id, customer_id, customer_name, customer_phone, cashier_name, purchase_date, gross_amount, discount, total_amount, points_earned, payment_method, reward_name, notes, items) VALUES
('INV-2026-1042', 'cust_1', 'Rahul Sharma', '98xxxxxxxx', 'Sunil Verma', '2026-11-08 11:20:00+00', 1450.00, 50.00, 1400.00, 14, 'UPI', '₹50 Bill Discount Voucher', 'Customer used welcome discount voucher', '[{"id":"1","description":"Organic Aashirvaad Atta 5kg","amount":320},{"id":"2","description":"Fortune Sunflower Oil 1L","amount":160},{"id":"3","description":"Amul Cow Butter 500g","amount":275},{"id":"4","description":"Household Essentials","amount":695}]'::jsonb),
('INV-2026-1038', 'cust_2', 'Priya Patel', '90xxxxxxx', 'Sunil Verma', '2026-11-07 18:45:00+00', 3200.00, 0.00, 3200.00, 32, 'Card', NULL, 'Monthly bulk groceries replenishment', '[{"id":"1","description":"Basmati Rice 10kg","amount":1150},{"id":"2","description":"Dairy & Fresh Produce","amount":850},{"id":"3","description":"Pantry & Snacks","amount":1200}]'::jsonb),
('INV-2026-1021', 'cust_3', 'Amit Kumar', '97xxxxxxx', 'Anita Desai', '2026-11-05 14:10:00+00', 850.00, 0.00, 850.00, 8, 'UPI', NULL, 'Quick evening checkout', '[{"id":"1","description":"Fresh Fruits & Veggies","amount":430},{"id":"2","description":"Amul Milk 2L","amount":132},{"id":"3","description":"Britannia Bread & Eggs","amount":288}]'::jsonb)
ON CONFLICT (purchase_id) DO NOTHING;

-- Sample Redemptions
INSERT INTO redemptions (redemption_id, customer_id, reward_id, reward_name, points_spent, redeemed_at, voucher_code, status) VALUES
('rdm_1', 'cust_1', 'rew_1', '₹50 Bill Discount Voucher', 50, '2026-11-08 11:15:00+00', 'FM-RDM-49102', 'used'),
('rdm_2', 'cust_2', 'rew_3', '₹200 Gourmet Shopping Pass', 160, '2026-11-09 17:00:00+00', 'FM-RDM-88219', 'available')
ON CONFLICT (redemption_id) DO NOTHING;
