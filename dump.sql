\restrict b4BDKyhVYC5wpuCLhoe9kgQOa6PJURg5EZtYUTWzfTWyIyw0Gepxqyqz5KMtrU7
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
CREATE FUNCTION public.fn_calculate_tier(p_points integer) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    IF p_points >= 1200 THEN
        RETURN 'Platinum';
    ELSIF p_points >= 400 THEN
        RETURN 'Gold';
    ELSE
        RETURN 'Silver';
    END IF;
END;
$$;
CREATE FUNCTION public.fn_enrol_member(p_customer_id character varying, p_membership_id character varying, p_card_number character varying, p_name character varying, p_email character varying, p_phone character varying) RETURNS TABLE(customer_id character varying, card_number character varying, tier character varying, points integer)
    LANGUAGE plpgsql
    AS $$
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
$$;
CREATE FUNCTION public.fn_trg_award_purchase_points() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_points INTEGER;
    v_new_tier VARCHAR(20);
BEGIN
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
$$;
CREATE PROCEDURE public.sp_redeem_reward(IN p_redemption_id character varying, IN p_customer_id character varying, IN p_reward_id character varying, IN p_voucher_code character varying, INOUT p_status character varying DEFAULT 'FAILED'::character varying, INOUT p_message text DEFAULT ''::text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_member_points INTEGER;
    v_reward_cost INTEGER;
    v_reward_name VARCHAR(120);
    v_is_active BOOLEAN;
BEGIN
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
    SELECT points INTO v_member_points
    FROM memberships
    WHERE customer_id = p_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        p_status := 'NO_MEMBERSHIP';
        p_message := 'Loyalty membership record not found for customer.';
        RETURN;
    END IF;
    IF v_member_points < v_reward_cost THEN
        p_status := 'INSUFFICIENT_PTS';
        p_message := format('Insufficient points. Required: %s, Available: %s', v_reward_cost, v_member_points);
        RETURN;
    END IF;

    UPDATE memberships
    SET points = points - v_reward_cost,
        tier = fn_calculate_tier(points - v_reward_cost)
    WHERE customer_id = p_customer_id;

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
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE TABLE public.customers (
    customer_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150),
    phone character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE public.memberships (
    membership_id character varying(50) NOT NULL,
    customer_id character varying(50) NOT NULL,
    card_number character varying(30) NOT NULL,
    tier character varying(20) DEFAULT 'Silver'::character varying NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    joined_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT memberships_points_check CHECK ((points >= 0)),
    CONSTRAINT memberships_tier_check CHECK (((tier)::text = ANY ((ARRAY['Silver'::character varying, 'Gold'::character varying, 'Platinum'::character varying])::text[])))
);
CREATE TABLE public.purchases (
    purchase_id character varying(50) NOT NULL,
    customer_id character varying(50),
    customer_name character varying(100),
    customer_phone character varying(20),
    cashier_name character varying(100) NOT NULL,
    purchase_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    gross_amount numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    points_earned integer DEFAULT 0 NOT NULL,
    payment_method character varying(20) NOT NULL,
    reward_id character varying(50),
    reward_name character varying(120),
    notes text,
    items jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT purchases_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT purchases_gross_amount_check CHECK ((gross_amount >= (0)::numeric)),
    CONSTRAINT purchases_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['UPI'::character varying, 'Card'::character varying, 'Cash'::character varying])::text[]))),
    CONSTRAINT purchases_points_earned_check CHECK ((points_earned >= 0)),
    CONSTRAINT purchases_total_amount_check CHECK ((total_amount >= (0)::numeric))
);
CREATE TABLE public.redemptions (
    redemption_id character varying(50) NOT NULL,
    customer_id character varying(50) NOT NULL,
    reward_id character varying(50) NOT NULL,
    reward_name character varying(120) NOT NULL,
    points_spent integer NOT NULL,
    redeemed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    voucher_code character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    CONSTRAINT redemptions_points_spent_check CHECK ((points_spent > 0)),
    CONSTRAINT redemptions_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'used'::character varying])::text[])))
);
CREATE TABLE public.rewards (
    reward_id character varying(50) NOT NULL,
    name character varying(120) NOT NULL,
    points_cost integer NOT NULL,
    discount numeric(10,2) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT rewards_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT rewards_points_cost_check CHECK ((points_cost > 0))
);

COPY public.customers (customer_id, name, email, phone, created_at) FROM stdin;
cust_1795012661899	sharky	8851735975@loyalty.freshmart.com	8851735975	2026-11-18 20:07:41.900579+05:30
cust_1795013136173	zesty lemon	9876137324@loyalty.freshmart.com	9876137324	2026-11-18 20:15:36.17472+05:30
\.


--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.memberships (membership_id, customer_id, card_number, tier, points, joined_on) FROM stdin;
mem_1795012661899	cust_1795012661899	SM-516171	Silver	120	2026-11-18 20:07:41.900579+05:30
mem_1795013136174	cust_1795013136173	SM-406075	Silver	0	2026-11-18 20:15:36.17472+05:30
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (purchase_id, customer_id, customer_name, customer_phone, cashier_name, purchase_date, gross_amount, discount, total_amount, points_earned, payment_method, reward_id, reward_name, notes, items) FROM stdin;
INV-2026-5766	cust_1795012661899	sharky	8851735975	Sunil Verma	2026-11-18 20:08:45.828059+05:30	1200.00	0.00	1200.00	120	UPI	\N	\N	\N	[]
\.


--
-- Data for Name: redemptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.redemptions (redemption_id, customer_id, reward_id, reward_name, points_spent, redeemed_at, voucher_code, status) FROM stdin;
\.


--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rewards (reward_id, name, points_cost, discount, description, is_active) FROM stdin;
rew_1795013464266	200inr discount on fresh produce	800	200.00	limited to fresh produce only\nvalid till dec 15 , 2026	t
\.


--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- Name: customers customers_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_phone_key UNIQUE (phone);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- Name: memberships memberships_card_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_card_number_key UNIQUE (card_number);


--
-- Name: memberships memberships_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_customer_id_key UNIQUE (customer_id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (membership_id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (purchase_id);


--
-- Name: redemptions redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_pkey PRIMARY KEY (redemption_id);


--
-- Name: redemptions redemptions_voucher_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_voucher_code_key UNIQUE (voucher_code);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (reward_id);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- Name: idx_memberships_card_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memberships_card_number ON public.memberships USING btree (card_number);


--
-- Name: idx_memberships_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memberships_customer_id ON public.memberships USING btree (customer_id);


--
-- Name: idx_purchases_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchases_customer_id ON public.purchases USING btree (customer_id);


--
-- Name: idx_purchases_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchases_date ON public.purchases USING btree (purchase_date DESC);


--
-- Name: idx_redemptions_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemptions_customer_id ON public.redemptions USING btree (customer_id);


--
-- Name: idx_redemptions_voucher_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemptions_voucher_code ON public.redemptions USING btree (voucher_code);


--
-- Name: purchases trg_award_purchase_points; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_award_purchase_points AFTER INSERT ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.fn_trg_award_purchase_points();


--
-- Name: memberships memberships_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE;


--
-- Name: purchases purchases_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE SET NULL;


--
-- Name: purchases purchases_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(reward_id) ON DELETE SET NULL;


--
-- Name: redemptions redemptions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE;


--
-- Name: redemptions redemptions_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemptions
    ADD CONSTRAINT redemptions_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(reward_id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict b4BDKyhVYC5wpuCLhoe9kgQOa6PJURg5EZtYUTWzfTWyIyw0Gepxqyqz5KMtrU7

