-- Create OTP verifications table
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow the service to manage OTP records
CREATE POLICY "Service role can manage OTP records"
ON public.otp_verifications
FOR ALL
USING (true);

-- Create index for faster queries
CREATE INDEX idx_otp_phone_verified ON public.otp_verifications(phone, verified, expires_at);

-- Auto-delete expired OTPs (cleanup old records)
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < now() - interval '1 day';
END;
$$;