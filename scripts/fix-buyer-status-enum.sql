-- ═══════════════════════════════════════════════════════════════════
-- FIX BUYER STATUS ENUM - Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Check current enum values
SELECT enum_range(NULL::buyer_status);

-- Step 2: Add new values to the existing enum
-- (PostgreSQL allows adding values to enums but not removing them)

-- Add each status value if it doesn't exist
DO $$
BEGIN
    -- Standard pipeline statuses
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Contact Pending' AND enumtypid = 'buyer_status'::regtype) THEN
        ALTER TYPE buyer_status ADD VALUE 'Contact Pending';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Follow Up' AND enumtypid = 'buyer_status'::regtype) THEN
        ALTER TYPE buyer_status ADD VALUE 'Follow Up';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Viewing Booked' AND enumtypid = 'buyer_status'::regtype) THEN
        ALTER TYPE buyer_status ADD VALUE 'Viewing Booked';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Negotiating' AND enumtypid = 'buyer_status'::regtype) THEN
        ALTER TYPE buyer_status ADD VALUE 'Negotiating';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Reserved' AND enumtypid = 'buyer_status'::regtype) THEN
        ALTER TYPE buyer_status ADD VALUE 'Reserved';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Exchanged' AND enumtypid = 'buyer_status'::regtype) THEN
        ALTER TYPE buyer_status ADD VALUE 'Exchanged';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Completed' AND enumtypid = 'buyer_status'::regtype) THEN
        ALTER TYPE buyer_status ADD VALUE 'Completed';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Not Proceeding' AND enumtypid = 'buyer_status'::regtype) THEN
        ALTER TYPE buyer_status ADD VALUE 'Not Proceeding';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Duplicate' AND enumtypid = 'buyer_status'::regtype) THEN
        ALTER TYPE buyer_status ADD VALUE 'Duplicate';
    END IF;
END $$;

-- Step 3: Verify the updated enum
SELECT enum_range(NULL::buyer_status);

-- Step 4: Check if there are any leads with invalid statuses
SELECT status, COUNT(*) as count
FROM public.buyers
GROUP BY status
ORDER BY count DESC;
