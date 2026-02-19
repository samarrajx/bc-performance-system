-- Add must_change_password column if it doesn't exist
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT true;

-- Update existing records to have this flag (optional, good for initial setup)
-- UPDATE public.agents SET must_change_password = true WHERE must_change_password IS NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
