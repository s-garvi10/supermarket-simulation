-- ============================================================================
-- Supermarket Rewards & Loyalty Management System - PostgreSQL DDL Schema
-- ============================================================================

-- Drop tables in reverse dependency order if recreating
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 1. Customers Table
CREATE TABLE customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- 2. Memberships Table
CREATE TABLE memberships (
    membership_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) UNIQUE NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    card_number VARCHAR(30) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'Silver' CHECK (tier IN ('Silver', 'Gold', 'Platinum')),
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    joined_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memberships_card_number ON memberships(card_number);
CREATE INDEX idx_memberships_customer_id ON memberships(customer_id);

-- 3. Rewards Catalog Table
CREATE TABLE rewards (
    reward_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    discount NUMERIC(10, 2) NOT NULL CHECK (discount >= 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Purchases (Sales / Invoices) Table
CREATE TABLE purchases (
    purchase_id VARCHAR(50) PRIMARY KEY, -- e.g. INV-2026-1042
    customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE SET NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    cashier_name VARCHAR(100) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    gross_amount NUMERIC(10, 2) NOT NULL CHECK (gross_amount >= 0),
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('UPI', 'Card', 'Cash')),
    reward_id VARCHAR(50) REFERENCES rewards(reward_id) ON DELETE SET NULL,
    reward_name VARCHAR(120),
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_purchases_customer_id ON purchases(customer_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date DESC);

-- 5. Redemptions Table
CREATE TABLE redemptions (
    redemption_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    reward_id VARCHAR(50) NOT NULL REFERENCES rewards(reward_id) ON DELETE RESTRICT,
    reward_name VARCHAR(120) NOT NULL,
    points_spent INTEGER NOT NULL CHECK (points_spent > 0),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    voucher_code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used'))
);

CREATE INDEX idx_redemptions_customer_id ON redemptions(customer_id);
CREATE INDEX idx_redemptions_voucher_code ON redemptions(voucher_code);
