-- Make the course-files bucket public
UPDATE storage.buckets SET public = true WHERE id = 'course-files';

-- Create contacts table for ManyChat contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'instagram',
  contact_id TEXT NOT NULL,
  user_handle TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, platform, contact_id)
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts
CREATE POLICY "Coaches can view their own contacts" ON public.contacts
FOR SELECT USING (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all contacts" ON public.contacts
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can insert contacts" ON public.contacts
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update contacts" ON public.contacts
FOR UPDATE USING (true);

-- Add messages column to dm_sessions
ALTER TABLE public.dm_sessions ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb;