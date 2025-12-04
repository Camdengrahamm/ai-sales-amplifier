-- Create plan enum
CREATE TYPE public.coach_plan AS ENUM ('basic', 'standard', 'premium');

-- Add plan and AI customization fields to coaches table
ALTER TABLE public.coaches 
  ADD COLUMN plan coach_plan NOT NULL DEFAULT 'basic',
  ADD COLUMN system_prompt TEXT,
  ADD COLUMN tone TEXT DEFAULT 'friendly',
  ADD COLUMN response_style TEXT DEFAULT 'concise',
  ADD COLUMN brand_voice TEXT,
  ADD COLUMN escalation_email TEXT,
  ADD COLUMN max_questions_before_cta INTEGER DEFAULT 3;

-- Remove commission columns from coaches
ALTER TABLE public.coaches 
  DROP COLUMN IF EXISTS default_commission_rate;

-- Remove commission columns from sales (keep for analytics)
ALTER TABLE public.sales 
  DROP COLUMN IF EXISTS commission_rate_used,
  DROP COLUMN IF EXISTS commission_due;

-- Drop payouts table (no longer needed with retainer model)
DROP TABLE IF EXISTS public.payouts;

-- Add onboarding status to coaches
ALTER TABLE public.coaches 
  ADD COLUMN onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN content_uploaded BOOLEAN DEFAULT false;