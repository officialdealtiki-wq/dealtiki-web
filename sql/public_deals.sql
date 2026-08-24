-- DealTiki Public Deals Table & Indexes
-- Run this script in your Supabase SQL Editor to provision the public-safe deals table.

-- 1. Table Definition with persistent slug and timestamps
CREATE TABLE IF NOT EXISTS public.public_deals (
    id TEXT PRIMARY KEY,
    slug TEXT,
    source_id TEXT,
    post_key TEXT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    merchant TEXT NOT NULL,
    platform TEXT NOT NULL,
    category TEXT,
    deal_type TEXT NOT NULL DEFAULT 'product', -- 'product', 'campaign', 'coupon', 'telegram', 'cuelinks-offer'
    mrp NUMERIC(10, 2),
    deal_price NUMERIC(10, 2),
    discount_percent INTEGER,
    rating NUMERIC(3, 2),
    review_count INTEGER,
    coupon_code TEXT,
    affiliate_url TEXT,
    affiliate_provider TEXT,
    campaign_name TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'hidden'
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    source TEXT DEFAULT 'DealTiki Engine',
    source_url TEXT,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration safety for existing tables without slug column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'public_deals' AND column_name = 'slug'
    ) THEN
        ALTER TABLE public.public_deals ADD COLUMN slug TEXT;
    END IF;
END $$;

-- 2. Performance, Slug & Deduplication Query Indexes (Idempotent)
CREATE INDEX IF NOT EXISTS idx_public_deals_slug ON public.public_deals(slug);
CREATE INDEX IF NOT EXISTS idx_public_deals_status ON public.public_deals(status);
CREATE INDEX IF NOT EXISTS idx_public_deals_expires_at ON public.public_deals(expires_at);
CREATE INDEX IF NOT EXISTS idx_public_deals_active_non_expired ON public.public_deals(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_public_deals_post_key ON public.public_deals(post_key);
CREATE INDEX IF NOT EXISTS idx_public_deals_source_id ON public.public_deals(source_id);
CREATE INDEX IF NOT EXISTS idx_public_deals_platform ON public.public_deals(platform);
CREATE INDEX IF NOT EXISTS idx_public_deals_merchant ON public.public_deals(merchant);
CREATE INDEX IF NOT EXISTS idx_public_deals_category ON public.public_deals(category);
CREATE INDEX IF NOT EXISTS idx_public_deals_created_at ON public.public_deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_deals_first_seen_at ON public.public_deals(first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_deals_discount ON public.public_deals(discount_percent DESC);
CREATE INDEX IF NOT EXISTS idx_public_deals_deal_type ON public.public_deals(deal_type);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.public_deals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration to ensure idempotency
DROP POLICY IF EXISTS "Public Read Access for Active Deals" ON public.public_deals;
DROP POLICY IF EXISTS "Public Read Access for Active Non-Expired Deals" ON public.public_deals;
DROP POLICY IF EXISTS "Service Role Upsert Access" ON public.public_deals;

-- 3a. Anyone (anonymous & authenticated visitors) can read active, non-expired deals
CREATE POLICY "Public Read Access for Active Non-Expired Deals"
    ON public.public_deals
    FOR SELECT
    USING (
        status = 'active'
        AND (
            expires_at IS NULL
            OR expires_at > NOW()
        )
    );

-- 3b. Service Role retains full read/write/upsert access
CREATE POLICY "Service Role Upsert Access"
    ON public.public_deals
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. Idempotent PostgreSQL RPC Function for safe bulk upserts preserving first_seen_at & created_at
CREATE OR REPLACE FUNCTION public.upsert_public_deal_record(
    p_id TEXT,
    p_slug TEXT,
    p_source_id TEXT,
    p_post_key TEXT,
    p_title TEXT,
    p_description TEXT,
    p_image_url TEXT,
    p_merchant TEXT,
    p_platform TEXT,
    p_category TEXT,
    p_deal_type TEXT,
    p_mrp NUMERIC,
    p_deal_price NUMERIC,
    p_discount_percent INTEGER,
    p_rating NUMERIC,
    p_review_count INTEGER,
    p_coupon_code TEXT,
    p_affiliate_url TEXT,
    p_affiliate_provider TEXT,
    p_campaign_name TEXT,
    p_status TEXT,
    p_starts_at TIMESTAMPTZ,
    p_expires_at TIMESTAMPTZ,
    p_source TEXT,
    p_source_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.public_deals (
        id, slug, source_id, post_key, title, description, image_url,
        merchant, platform, category, deal_type, mrp, deal_price, discount_percent,
        rating, review_count, coupon_code, affiliate_url, affiliate_provider,
        campaign_name, status, starts_at, expires_at, source, source_url,
        first_seen_at, last_seen_at, created_at, updated_at
    ) VALUES (
        p_id, p_slug, p_source_id, p_post_key, p_title, p_description, p_image_url,
        p_merchant, p_platform, p_category, p_deal_type, p_mrp, p_deal_price, p_discount_percent,
        p_rating, p_review_count, p_coupon_code, p_affiliate_url, p_affiliate_provider,
        p_campaign_name, p_status, p_starts_at, p_expires_at, p_source, p_source_url,
        NOW(), NOW(), NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        slug = COALESCE(EXCLUDED.slug, public.public_deals.slug),
        source_id = COALESCE(EXCLUDED.source_id, public.public_deals.source_id),
        post_key = COALESCE(EXCLUDED.post_key, public.public_deals.post_key),
        title = EXCLUDED.title,
        description = COALESCE(EXCLUDED.description, public.public_deals.description),
        image_url = COALESCE(EXCLUDED.image_url, public.public_deals.image_url),
        merchant = EXCLUDED.merchant,
        platform = EXCLUDED.platform,
        category = COALESCE(EXCLUDED.category, public.public_deals.category),
        deal_type = EXCLUDED.deal_type,
        mrp = COALESCE(EXCLUDED.mrp, public.public_deals.mrp),
        deal_price = COALESCE(EXCLUDED.deal_price, public.public_deals.deal_price),
        discount_percent = COALESCE(EXCLUDED.discount_percent, public.public_deals.discount_percent),
        rating = COALESCE(EXCLUDED.rating, public.public_deals.rating),
        review_count = COALESCE(EXCLUDED.review_count, public.public_deals.review_count),
        coupon_code = COALESCE(EXCLUDED.coupon_code, public.public_deals.coupon_code),
        affiliate_url = COALESCE(EXCLUDED.affiliate_url, public.public_deals.affiliate_url),
        affiliate_provider = COALESCE(EXCLUDED.affiliate_provider, public.public_deals.affiliate_provider),
        campaign_name = COALESCE(EXCLUDED.campaign_name, public.public_deals.campaign_name),
        status = EXCLUDED.status,
        starts_at = COALESCE(EXCLUDED.starts_at, public.public_deals.starts_at),
        expires_at = COALESCE(EXCLUDED.expires_at, public.public_deals.expires_at),
        source = COALESCE(EXCLUDED.source, public.public_deals.source),
        source_url = COALESCE(EXCLUDED.source_url, public.public_deals.source_url),
        last_seen_at = NOW(),
        updated_at = NOW();
        -- NOTE: first_seen_at and created_at are preserved untouched!
END;
$$;

-- 5. Enable Supabase Realtime safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'public_deals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.public_deals;
    END IF;
END $$;

COMMENT ON TABLE public.public_deals IS 'Public-safe deal feed persistence table for DealTiki web discovery layer.';
