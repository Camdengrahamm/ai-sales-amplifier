-- This migration helps set up the first admin user
-- Replace 'YOUR_EMAIL_HERE' with your actual email address

-- First, let's create a helper function to make a user an admin
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN 'User not found with email: ' || user_email;
  END IF;

  -- Insert or update the admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) 
  DO NOTHING;

  RETURN 'User ' || user_email || ' is now an admin!';
END;
$$;

-- Example usage (uncomment and replace with your email):
-- SELECT public.make_user_admin('your.email@example.com');