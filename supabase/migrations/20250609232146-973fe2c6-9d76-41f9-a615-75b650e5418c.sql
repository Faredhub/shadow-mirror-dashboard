
-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('class-documents', 'class-documents', true),
  ('work-documents', 'work-documents', true);

-- Create storage policies for class-documents bucket
CREATE POLICY "Allow authenticated users to upload class documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'class-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view class documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'class-documents');

CREATE POLICY "Allow authenticated users to update class documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'class-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to delete class documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'class-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for work-documents bucket
CREATE POLICY "Allow authenticated users to upload work documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'work-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view work documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'work-documents');

CREATE POLICY "Allow authenticated users to update work documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'work-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to delete work documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'work-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fix RLS policies for work_activities table to allow admin operations
DROP POLICY IF EXISTS "Faculty can create their own work activities" ON public.work_activities;

CREATE POLICY "Faculty and admins can create work activities" 
  ON public.work_activities 
  FOR INSERT 
  WITH CHECK (
    faculty_id = auth.uid() OR 
    public.get_current_user_role() = 'admin'
  );

-- Also ensure all tables have proper RLS policies that work for both faculty and admin
ALTER TABLE public.class_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_details ENABLE ROW LEVEL SECURITY;

-- Update class_records policies to allow admin creation
DROP POLICY IF EXISTS "Faculty can create their own class records" ON public.class_records;

CREATE POLICY "Faculty and admins can create class records" 
  ON public.class_records 
  FOR INSERT 
  WITH CHECK (
    faculty_id = auth.uid() OR 
    public.get_current_user_role() = 'admin'
  );

-- Update work_details policies to allow admin creation  
DROP POLICY IF EXISTS "Faculty can create their own work details" ON public.work_details;

CREATE POLICY "Faculty and admins can create work details" 
  ON public.work_details 
  FOR INSERT 
  WITH CHECK (
    faculty_id = auth.uid() OR 
    public.get_current_user_role() = 'admin'
  );
