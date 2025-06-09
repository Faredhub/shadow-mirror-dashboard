
-- Fix RLS policies for work_activities table
ALTER TABLE public.work_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own work activities" ON public.work_activities;
DROP POLICY IF EXISTS "Users can create their own work activities" ON public.work_activities;
DROP POLICY IF EXISTS "Users can update their own work activities" ON public.work_activities;
DROP POLICY IF EXISTS "Users can delete their own work activities" ON public.work_activities;
DROP POLICY IF EXISTS "Admins can view all work activities" ON public.work_activities;
DROP POLICY IF EXISTS "Admins can manage all work activities" ON public.work_activities;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create new RLS policies that allow both faculty and admin access
CREATE POLICY "Faculty can view their own work activities" 
  ON public.work_activities 
  FOR SELECT 
  USING (faculty_id = auth.uid() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Faculty can create their own work activities" 
  ON public.work_activities 
  FOR INSERT 
  WITH CHECK (faculty_id = auth.uid() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Faculty can update their own work activities" 
  ON public.work_activities 
  FOR UPDATE 
  USING (faculty_id = auth.uid() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Faculty can delete their own work activities" 
  ON public.work_activities 
  FOR DELETE 
  USING (faculty_id = auth.uid() OR public.get_current_user_role() = 'admin');

-- Create tables for the new faculty dashboard sections
CREATE TABLE IF NOT EXISTS public.class_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES public.profiles(id) NOT NULL,
  topic_covered TEXT NOT NULL,
  students_present INTEGER NOT NULL,
  students_absent INTEGER NOT NULL,
  total_students INTEGER NOT NULL,
  document_url TEXT,
  description TEXT,
  remarks TEXT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.work_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID REFERENCES public.profiles(id) NOT NULL,
  work_type TEXT NOT NULL,
  duration TEXT NOT NULL,
  document_url TEXT,
  description TEXT NOT NULL,
  remarks TEXT,
  slot_type TEXT DEFAULT 'morning',
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE public.class_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for class_records
CREATE POLICY "Faculty can view their own class records" 
  ON public.class_records 
  FOR SELECT 
  USING (faculty_id = auth.uid() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Faculty can create their own class records" 
  ON public.class_records 
  FOR INSERT 
  WITH CHECK (faculty_id = auth.uid());

CREATE POLICY "Faculty can update their own class records" 
  ON public.class_records 
  FOR UPDATE 
  USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can delete their own class records" 
  ON public.class_records 
  FOR DELETE 
  USING (faculty_id = auth.uid());

-- Create RLS policies for work_details
CREATE POLICY "Faculty can view their own work details" 
  ON public.work_details 
  FOR SELECT 
  USING (faculty_id = auth.uid() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Faculty can create their own work details" 
  ON public.work_details 
  FOR INSERT 
  WITH CHECK (faculty_id = auth.uid());

CREATE POLICY "Faculty can update their own work details" 
  ON public.work_details 
  FOR UPDATE 
  USING (faculty_id = auth.uid());

CREATE POLICY "Faculty can delete their own work details" 
  ON public.work_details 
  FOR DELETE 
  USING (faculty_id = auth.uid());
