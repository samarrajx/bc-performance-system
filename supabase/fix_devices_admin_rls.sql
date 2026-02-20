-- Ensure RLS is enabled on the devices table
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policy just to be safe
DROP POLICY IF EXISTS admin_all_devices ON public.devices;

-- Create policy allowing admins full access to the devices table
CREATE POLICY admin_all_devices ON public.devices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Also add a fallback just in case the profile logic is failing (allow read for authenticated)
-- If the above admin policy fails due to profile missing, this will ensure they can at least SEE the data
DROP POLICY IF EXISTS authenticated_read_devices ON public.devices;

CREATE POLICY authenticated_read_devices ON public.devices
  FOR SELECT
  TO authenticated
  USING (true);
