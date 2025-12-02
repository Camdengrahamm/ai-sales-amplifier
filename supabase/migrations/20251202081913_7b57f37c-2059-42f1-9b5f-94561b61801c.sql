-- Create storage bucket for course files
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', false);

-- Storage policies for course files
CREATE POLICY "Coaches can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'course-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can view their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'course-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all course files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'course-files' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);