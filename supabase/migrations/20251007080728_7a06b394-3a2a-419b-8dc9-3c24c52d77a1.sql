-- Ensure the trigger function properly links suppliers to users based on phone numbers
-- This function will be called after a user signs up
CREATE OR REPLACE FUNCTION public.link_supplier_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_phone text;
BEGIN
  -- Get the phone number from the new user's metadata
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  
  -- If phone exists, link to any existing supplier record with same phone
  IF user_phone != '' THEN
    UPDATE public.suppliers
    SET user_id = NEW.id
    WHERE phone = user_phone AND user_id IS NULL;
    
    -- Log if a supplier was linked
    IF FOUND THEN
      RAISE NOTICE 'Linked supplier with phone % to user %', user_phone, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created_link_supplier ON auth.users;
CREATE TRIGGER on_auth_user_created_link_supplier
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_supplier_to_user();