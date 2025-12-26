-- Enable Row Level Security on investigations and add policies
-- Run this in Supabase SQL editor as a privileged user.

-- 1) Enable RLS
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;

-- 2) Allow authenticated users to SELECT investigations (players can read)
CREATE POLICY "Allow select for authenticated" ON public.investigations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3) Allow only the investigation creator (GM) to UPDATE the conspiracy_board_data
CREATE POLICY "Allow gm update conspiracy_board" ON public.investigations
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- 4) Allow inserts from creators (optional, adjust as needed)
CREATE POLICY "Allow insert investigations by authenticated" ON public.investigations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5) (Optional) Allow authenticated users to read investigations owned by campaigns they belong to
-- This requires a join or a membership table; implement according to your schema.

-- Notes:
-- - These policies assume `investigations` has a `created_by` column set when an investigation is created.
-- - After applying, test as different users. To allow a "GM" role other than the creator, add a column like `gm_user_id` and modify policies to check that column.
-- - For finer-grained control (players can add ephemeral annotations) consider adding a separate table for annotations with its own RLS rules.
