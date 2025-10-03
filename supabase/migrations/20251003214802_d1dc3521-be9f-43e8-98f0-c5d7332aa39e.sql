-- Add explicit deny policies for anonymous users to protect sensitive data
-- This prevents anyone without authentication from accessing personal information

-- Deny anonymous access to profiles table (contains phone numbers and names)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to milk_collections table (contains business data)
CREATE POLICY "Deny anonymous access to collections"
ON public.milk_collections
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to suppliers table (contains personal information)
CREATE POLICY "Deny anonymous access to suppliers"
ON public.suppliers
FOR SELECT
TO anon
USING (false);