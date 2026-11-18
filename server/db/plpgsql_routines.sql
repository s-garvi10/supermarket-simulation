-- ============================================================================
-- Supermarket Rewards & Loyalty Management System - PL/pgSQL Routines & Triggers
-- ============================================================================

-- 1. Function: Calculate Tier from Points
CREATE OR REPLACE FUNCTION fn_calculate_tier(p_points INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF p_points >= 1200 THEN
        RETURN 'Platinum';
    ELSIF p_points >= 400 THEN
        RETURN 'Gold';
    ELSE
        RETURN 'Silver';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Trigger Function: Automatically Award Points & Recalculate Tier on Purchase
CREATE OR REPLACE FUNCTION fn_trg_award_purchase_points()
RETURNS TRIGGER AS $$
DECLARE
    v_new_points INTEGER;
    v_new_tier VARCHAR(20);
BEGIN
    -- Only process if purchase is associated with a registered loyalty member
    IF NEW.customer_id IS NOT NULL AND NEW.points_earned > 0 THEN
        UPDATE memberships
        SET points = points + NEW.points_earned,
            tier = fn_calculate_tier(points + NEW.points_earned)
        WHERE customer_id = NEW.customer_id
        RETURNING points, tier INTO v_new_points, v_new_tier;

        RAISE NOTICE 'Member % awarded % pts. New Total: %, Tier: %', 
            NEW.customer_id, NEW.points_earned, v_new_points, v_new_tier;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach Trigger to purchases table
DROP TRIGGER IF EXISTS trg_award_purchase_points ON purchases;
CREATE TRIGGER trg_award_purchase_points
AFTER INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION fn_trg_award_purchase_points();

-- 3. Stored Procedure: Atomic Reward Voucher Redemption
CREATE OR REPLACE PROCEDURE sp_redeem_reward(
    p_redemption_id VARCHAR(50),
    p_customer_id VARCHAR(50),
    p_reward_id VARCHAR(50),
    p_voucher_code VARCHAR(50),
    INOUT p_status VARCHAR(20) DEFAULT 'FAILED',
    INOUT p_message TEXT DEFAULT ''
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_member_points INTEGER;
    v_reward_cost INTEGER;
    v_reward_name VARCHAR(120);
    v_is_active BOOLEAN;
BEGIN
    -- 1. Check if reward exists and is active
    SELECT name, points_cost, is_active
    INTO v_reward_name, v_reward_cost, v_is_active
    FROM rewards
    WHERE reward_id = p_reward_id;

    IF NOT FOUND THEN
        p_status := 'NOT_FOUND';
        p_message := 'Reward not found.';
        RETURN;
    END IF;

    IF NOT v_is_active THEN
        p_status := 'INACTIVE';
        p_message := 'This reward is currently inactive.';
        RETURN;
    END IF;

    -- 2. Lock membership row for update to prevent concurrent race conditions
    SELECT points INTO v_member_points
    FROM memberships
    WHERE customer_id = p_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        p_status := 'NO_MEMBERSHIP';
        p_message := 'Loyalty membership record not found for customer.';
        RETURN;
    END IF;

    -- 3. Check sufficient points balance
    IF v_member_points < v_reward_cost THEN
        p_status := 'INSUFFICIENT_PTS';
        p_message := format('Insufficient points. Required: %s, Available: %s', v_reward_cost, v_member_points);
        RETURN;
    END IF;

    -- 4. Deduct points and recalculate tier
    UPDATE memberships
    SET points = points - v_reward_cost,
        tier = fn_calculate_tier(points - v_reward_cost)
    WHERE customer_id = p_customer_id;

    -- 5. Record redemption voucher
    INSERT INTO redemptions (
        redemption_id,
        customer_id,
        reward_id,
        reward_name,
        points_spent,
        redeemed_at,
        voucher_code,
        status
    ) VALUES (
        p_redemption_id,
        p_customer_id,
        p_reward_id,
        v_reward_name,
        v_reward_cost,
        CURRENT_TIMESTAMP,
        p_voucher_code,
        'available'
    );

    p_status := 'SUCCESS';
    p_message := format('Voucher %s issued successfully! %s points deducted.', p_voucher_code, v_reward_cost);
END;
$$;

-- 4. Function: Enrol New Loyalty Customer (Transaction Safe)
CREATE OR REPLACE FUNCTION fn_enrol_member(
    p_customer_id VARCHAR(50),
    p_membership_id VARCHAR(50),
    p_card_number VARCHAR(30),
    p_name VARCHAR(100),
    p_email VARCHAR(150),
    p_phone VARCHAR(20)
)
RETURNS TABLE(
    customer_id VARCHAR(50),
    card_number VARCHAR(30),
    tier VARCHAR(20),
    points INTEGER
) AS $$
BEGIN
    INSERT INTO customers (customer_id, name, email, phone, created_at)
    VALUES (p_customer_id, p_name, p_email, p_phone, CURRENT_TIMESTAMP);

    INSERT INTO memberships (membership_id, customer_id, card_number, tier, points, joined_on)
    VALUES (p_membership_id, p_customer_id, p_card_number, 'Silver', 0, CURRENT_TIMESTAMP);

    RETURN QUERY
    SELECT c.customer_id, m.card_number, m.tier, m.points
    FROM customers c
    JOIN memberships m ON c.customer_id = m.customer_id
    WHERE c.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql;
