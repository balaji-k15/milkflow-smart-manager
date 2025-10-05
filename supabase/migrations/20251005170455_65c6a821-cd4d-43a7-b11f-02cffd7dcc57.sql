-- Create a function to delete the current user's account
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the user from auth.users (cascade will handle related records)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;