-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'coach');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create coaches table
CREATE TABLE public.coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    brand_name TEXT,
    main_checkout_url TEXT,
    default_commission_rate NUMERIC(5,2) DEFAULT 10.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Create course_files table
CREATE TABLE public.course_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_files ENABLE ROW LEVEL SECURITY;

-- Create embeddings table (for AI knowledge base)
CREATE TABLE public.embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
    content_chunk TEXT NOT NULL,
    embedding_vector vector(1536),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Create offers table
CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    base_price NUMERIC(10,2) NOT NULL,
    commission_rate NUMERIC(5,2),
    tracking_slug TEXT NOT NULL UNIQUE,
    target_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create clicks table
CREATE TABLE public.clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE NOT NULL,
    coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
    session_id TEXT NOT NULL,
    contact_email TEXT,
    source_channel TEXT DEFAULT 'instagram',
    user_agent TEXT,
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

-- Create sales table
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
    click_id UUID REFERENCES public.clicks(id) ON DELETE SET NULL,
    external_sale_id TEXT UNIQUE NOT NULL,
    contact_email TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    commission_rate_used NUMERIC(5,2) NOT NULL,
    commission_due NUMERIC(10,2) NOT NULL,
    source TEXT DEFAULT 'webhook',
    purchased_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create dm_sessions table
CREATE TABLE public.dm_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
    user_handle TEXT NOT NULL,
    question_count INT DEFAULT 0,
    last_question_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (coach_id, user_handle)
);

ALTER TABLE public.dm_sessions ENABLE ROW LEVEL SECURITY;

-- Create payouts table
CREATE TABLE public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sales_amount NUMERIC(10,2) NOT NULL,
    total_commission_due NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for coaches
CREATE POLICY "Coaches can view their own profile" ON public.coaches
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coaches" ON public.coaches
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert coaches" ON public.coaches
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can update their own profile" ON public.coaches
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all coaches" ON public.coaches
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for course_files
CREATE POLICY "Coaches can view their own files" ON public.course_files
FOR SELECT USING (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all files" ON public.course_files
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can upload their own files" ON public.course_files
FOR INSERT WITH CHECK (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Coaches can delete their own files" ON public.course_files
FOR DELETE USING (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

-- RLS Policies for offers
CREATE POLICY "Coaches can view their own offers" ON public.offers
FOR SELECT USING (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all offers" ON public.offers
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can create their own offers" ON public.offers
FOR INSERT WITH CHECK (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Coaches can update their own offers" ON public.offers
FOR UPDATE USING (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update all offers" ON public.offers
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for clicks (public can insert for tracking, coaches/admins can view)
CREATE POLICY "Public can create clicks" ON public.clicks
FOR INSERT WITH CHECK (true);

CREATE POLICY "Coaches can view their own clicks" ON public.clicks
FOR SELECT USING (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all clicks" ON public.clicks
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for sales
CREATE POLICY "Public can create sales" ON public.sales
FOR INSERT WITH CHECK (true);

CREATE POLICY "Coaches can view their own sales" ON public.sales
FOR SELECT USING (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all sales" ON public.sales
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for dm_sessions
CREATE POLICY "Public can create/update DM sessions" ON public.dm_sessions
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Coaches can view their own sessions" ON public.dm_sessions
FOR SELECT USING (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all sessions" ON public.dm_sessions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payouts
CREATE POLICY "Coaches can view their own payouts" ON public.payouts
FOR SELECT USING (
  coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all payouts" ON public.payouts
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage payouts" ON public.payouts
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_coaches_user_id ON public.coaches(user_id);
CREATE INDEX idx_course_files_coach_id ON public.course_files(coach_id);
CREATE INDEX idx_embeddings_coach_id ON public.embeddings(coach_id);
CREATE INDEX idx_offers_coach_id ON public.offers(coach_id);
CREATE INDEX idx_offers_tracking_slug ON public.offers(tracking_slug);
CREATE INDEX idx_clicks_offer_id ON public.clicks(offer_id);
CREATE INDEX idx_clicks_coach_id ON public.clicks(coach_id);
CREATE INDEX idx_clicks_session_id ON public.clicks(session_id);
CREATE INDEX idx_sales_coach_id ON public.sales(coach_id);
CREATE INDEX idx_sales_contact_email ON public.sales(contact_email);
CREATE INDEX idx_dm_sessions_coach_handle ON public.dm_sessions(coach_id, user_handle);
CREATE INDEX idx_payouts_coach_id ON public.payouts(coach_id);