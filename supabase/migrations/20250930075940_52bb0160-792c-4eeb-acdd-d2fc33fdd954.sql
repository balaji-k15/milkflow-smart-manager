-- Make fat_percentage nullable since we're removing it from calculations
ALTER TABLE milk_collections 
ALTER COLUMN fat_percentage DROP NOT NULL;

-- Update the calculation to be based on liters only
-- Rate per liter will be a fixed rate, not calculated from fat percentage
COMMENT ON COLUMN milk_collections.rate_per_liter IS 'Fixed rate per liter in Indian Rupees';
COMMENT ON COLUMN milk_collections.total_amount IS 'Total amount in Indian Rupees (quantity * rate_per_liter)';

-- Update profiles table to make phone the primary auth method
ALTER TABLE profiles 
ALTER COLUMN phone SET NOT NULL;

-- Add comment for Indian context
COMMENT ON TABLE milk_collections IS '2025 Indian dairy management - amounts in INR, calculations based on liters only';