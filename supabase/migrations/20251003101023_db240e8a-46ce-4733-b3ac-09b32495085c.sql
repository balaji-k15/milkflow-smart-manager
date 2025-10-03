-- Mark all existing users as email confirmed
-- This fixes the "Email not confirmed" error for existing accounts
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;