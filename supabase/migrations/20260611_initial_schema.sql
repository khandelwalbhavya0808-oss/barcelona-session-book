-- ==========================================================
-- Database Schema for Alex Moreno - Personal Trainer Booking
-- Date: 2026-06-11
-- ==========================================================

-- 1. Create Enums if they do not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'client', 'admin');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'rejected', 'banned');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'focus_type') THEN
    CREATE TYPE focus_type AS ENUM ('Strength', 'Conditioning', 'Mobility');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
    CREATE TYPE location_type AS ENUM ('Studio', 'Outdoor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'late_cancelled', 'attended', 'no-show');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waitlist_status') THEN
    CREATE TYPE waitlist_status AS ENUM ('waiting', 'booked', 'cancelled');
  END IF;
END $$;

-- 2. Create Security Helpers (Security Definer functions to avoid policy recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_active_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create Tables

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session Types (templates for sessions)
CREATE TABLE IF NOT EXISTS public.session_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  focus focus_type NOT NULL,
  location_type location_type NOT NULL,
  location_name TEXT NOT NULL,
  pricing NUMERIC(10, 2) NOT NULL,
  max_slots INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduled Sessions (individual calendar instances)
CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type_id UUID REFERENCES public.session_types(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  max_slots INTEGER NOT NULL,
  pricing NUMERIC(10, 2) NOT NULL,
  location_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled'
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_session_id UUID REFERENCES public.scheduled_sessions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status booking_status NOT NULL DEFAULT 'confirmed',
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Waitlists table
CREATE TABLE IF NOT EXISTS public.waitlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_session_id UUID REFERENCES public.scheduled_sessions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status waitlist_status NOT NULL DEFAULT 'waiting',
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_session_client_waitlist UNIQUE (scheduled_session_id, client_id)
);

-- Availability Rules (recurring weekly slots)
CREATE TABLE IF NOT EXISTS public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type_id UUID REFERENCES public.session_types(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Availability Exceptions (blocked dates)
CREATE TABLE IF NOT EXISTS public.availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type_id UUID REFERENCES public.session_types(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_cancelled BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. History Logs Tables

-- User Login History
CREATE TABLE IF NOT EXISTS public.user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Booking History Log
CREATE TABLE IF NOT EXISTS public.booking_history_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'cancelled_by_client', 'cancelled_by_admin', 'marked_attended', 'marked_no_show', 'waitlist_promoted'
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session History Log
CREATE TABLE IF NOT EXISTS public.session_history_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'cancelled'
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Status History
CREATE TABLE IF NOT EXISTS public.client_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_role user_role,
  new_role user_role,
  previous_status user_status,
  new_status user_status,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_history_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_history_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_status_history ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Profiles Policies
CREATE POLICY "Profiles are readable by self and admins" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));

CREATE POLICY "Profiles can be updated by self (active) and admins" ON public.profiles
  FOR UPDATE USING (
    (auth.uid() = id AND is_active_user(auth.uid())) 
    OR is_admin(auth.uid())
  );

-- Session Types Policies (publicly viewable templates, editable only by admin)
CREATE POLICY "Session types are readable by anyone" ON public.session_types
  FOR SELECT USING (is_active = TRUE OR is_admin(auth.uid()));

CREATE POLICY "Session types are manageable by admin" ON public.session_types
  FOR ALL USING (is_admin(auth.uid()));

-- Scheduled Sessions Policies (publicly viewable slots, editable only by admin)
CREATE POLICY "Scheduled sessions are readable by anyone" ON public.scheduled_sessions
  FOR SELECT USING (TRUE);

CREATE POLICY "Scheduled sessions are manageable by admin" ON public.scheduled_sessions
  FOR ALL USING (is_admin(auth.uid()));

-- Bookings Policies
CREATE POLICY "Bookings readable by self and admins" ON public.bookings
  FOR SELECT USING (
    (client_id = auth.uid() AND is_active_user(auth.uid())) 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Bookings insertable by self (active) and admins" ON public.bookings
  FOR INSERT WITH CHECK (
    (client_id = auth.uid() AND is_active_user(auth.uid())) 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Bookings updatable by self (active) and admins" ON public.bookings
  FOR UPDATE USING (
    (client_id = auth.uid() AND is_active_user(auth.uid())) 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Bookings deletable by admins only" ON public.bookings
  FOR DELETE USING (is_admin(auth.uid()));

-- Waitlists Policies
CREATE POLICY "Waitlists readable by self and admins" ON public.waitlists
  FOR SELECT USING (
    (client_id = auth.uid() AND is_active_user(auth.uid())) 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Waitlists insertable by self (active) and admins" ON public.waitlists
  FOR INSERT WITH CHECK (
    (client_id = auth.uid() AND is_active_user(auth.uid())) 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Waitlists updatable by self (active) and admins" ON public.waitlists
  FOR UPDATE USING (
    (client_id = auth.uid() AND is_active_user(auth.uid())) 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Waitlists deletable by self and admins" ON public.waitlists
  FOR DELETE USING (
    (client_id = auth.uid() AND is_active_user(auth.uid())) 
    OR is_admin(auth.uid())
  );

-- Availability Rules Policies
CREATE POLICY "Availability rules manageable by admin" ON public.availability_rules
  FOR ALL USING (is_admin(auth.uid()));

-- Availability Exceptions Policies
CREATE POLICY "Availability exceptions manageable by admin" ON public.availability_exceptions
  FOR ALL USING (is_admin(auth.uid()));

-- History Logs Policies (readable and manageable only by admin)
CREATE POLICY "Logs manageable by admin" ON public.user_login_history FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Logs manageable by admin" ON public.booking_history_log FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Logs manageable by admin" ON public.session_history_log FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Logs manageable by admin" ON public.client_status_history FOR ALL USING (is_admin(auth.uid()));

-- 7. Database Triggers & Trigger Functions

-- Automatically create a profile upon auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    'active'
  );
  
  -- Insert into history logs
  INSERT INTO public.client_status_history (user_id, previous_role, new_role, previous_status, new_status, reason)
  VALUES (NEW.id, NULL, 'user', NULL, 'active', 'Initial registration');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to upgrade role from user to client on booking creation
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  current_role user_role;
BEGIN
  -- Upgrade role
  SELECT role INTO current_role FROM public.profiles WHERE id = NEW.client_id;
  IF current_role = 'user' THEN
    UPDATE public.profiles
    SET role = 'client'
    WHERE id = NEW.client_id;

    INSERT INTO public.client_status_history (user_id, previous_role, new_role, previous_status, new_status, reason)
    VALUES (NEW.client_id, 'user', 'client', 'active', 'active', 'Upgraded role on first booking creation');
  END IF;

  -- Create booking history log
  INSERT INTO public.booking_history_log (booking_id, action, changed_by, notes)
  VALUES (NEW.id, 'created', NEW.client_id, 'Booking created by user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_booking();

-- Validate slot availability before booking insertion
CREATE OR REPLACE FUNCTION public.check_booking_slots()
RETURNS TRIGGER AS $$
DECLARE
  current_bookings_count INTEGER;
  allowed_max_slots INTEGER;
  sess_status TEXT;
BEGIN
  -- Verify session status is active
  SELECT status, max_slots INTO sess_status, allowed_max_slots
  FROM public.scheduled_sessions
  WHERE id = NEW.scheduled_session_id;

  IF sess_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot book a cancelled session.';
  END IF;

  -- Verify current bookings count
  SELECT COUNT(*) INTO current_bookings_count
  FROM public.bookings
  WHERE scheduled_session_id = NEW.scheduled_session_id AND status = 'confirmed';

  IF current_bookings_count >= allowed_max_slots THEN
    RAISE EXCEPTION 'This session is already full.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER before_booking_inserted
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.check_booking_slots();

-- Waitlist promotion logic when a booking is cancelled
CREATE OR REPLACE FUNCTION public.handle_booking_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  next_waitlist_record RECORD;
BEGIN
  -- Log standard booking updates
  IF NEW.status <> OLD.status THEN
    INSERT INTO public.booking_history_log (booking_id, action, changed_by, notes)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.status = 'cancelled' THEN 'cancelled_by_client'
        WHEN NEW.status = 'late_cancelled' THEN 'cancelled_late'
        WHEN NEW.status = 'attended' THEN 'marked_attended'
        WHEN NEW.status = 'no-show' THEN 'marked_no_show'
        ELSE 'status_updated'
      END,
      auth.uid(),
      'Booking status updated from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;

  -- Trigger promotion if booking is cancelled/late_cancelled and was previously confirmed
  IF (NEW.status = 'cancelled' OR NEW.status = 'late_cancelled') AND OLD.status = 'confirmed' THEN
    -- Get top person waiting on the waitlist
    SELECT * INTO next_waitlist_record
    FROM public.waitlists
    WHERE scheduled_session_id = NEW.scheduled_session_id AND status = 'waiting'
    ORDER BY position ASC, created_at ASC
    LIMIT 1;

    IF next_waitlist_record IS NOT NULL THEN
      -- Mark waitlist row as booked
      UPDATE public.waitlists
      SET status = 'booked'
      WHERE id = next_waitlist_record.id;

      -- Book the slot for the waitlisted client
      INSERT INTO public.bookings (scheduled_session_id, client_id, status, payment_status)
      VALUES (NEW.scheduled_session_id, next_waitlist_record.client_id, 'confirmed', 'pending');

      -- Insert promotion log
      INSERT INTO public.booking_history_log (booking_id, action, notes)
      VALUES (NEW.id, 'waitlist_promoted', 'User ' || next_waitlist_record.client_id || ' promoted from waitlist to booking.');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_booking_updated
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_cancellation();

-- 8. Useful Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_time ON public.scheduled_sessions(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON public.bookings(scheduled_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_waitlists_session ON public.waitlists(scheduled_session_id);
CREATE INDEX IF NOT EXISTS idx_waitlists_client ON public.waitlists(client_id);
CREATE INDEX IF NOT EXISTS idx_availability_rules_day ON public.availability_rules(day_of_week);
