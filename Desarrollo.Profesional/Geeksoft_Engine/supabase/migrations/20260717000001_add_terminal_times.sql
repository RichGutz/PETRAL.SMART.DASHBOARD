-- Add operational time parameters to the terminals table
ALTER TABLE terminals 
ADD COLUMN IF NOT EXISTS mooring_time_hrs NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unmooring_time_hrs NUMERIC(5,2) DEFAULT 0;
