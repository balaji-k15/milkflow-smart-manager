-- Drop the insecure otp_verifications table since OTP authentication is no longer used
DROP TABLE IF EXISTS public.otp_verifications CASCADE;

-- Drop the cleanup function as well
DROP FUNCTION IF EXISTS public.delete_expired_otps();