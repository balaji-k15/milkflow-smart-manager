-- Function to automatically link supplier record to user account by phone number
CREATE OR REPLACE FUNCTION public.link_supplier_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_phone text;
BEGIN
  -- Get the phone number from the new user's profile
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  
  -- If phone exists, link to any existing supplier record with same phone
  IF user_phone != '' THEN
    UPDATE public.suppliers
    SET user_id = NEW.id
    WHERE phone = user_phone AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to link supplier after user signup
DROP TRIGGER IF EXISTS on_auth_user_created_link_supplier ON auth.users;
CREATE TRIGGER on_auth_user_created_link_supplier
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_supplier_to_user();

-- Enable realtime for milk_collections table
ALTER TABLE public.milk_collections REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.milk_collections;