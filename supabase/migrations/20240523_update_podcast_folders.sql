-- Check if podcast_folders table exists
CREATE TABLE IF NOT EXISTS public.podcast_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parent_id UUID REFERENCES public.podcast_folders(id)
);

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'podcast_folders' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.podcast_folders ADD COLUMN user_id UUID;
    
    -- Add index for user_id
    CREATE INDEX podcast_folders_user_id_idx ON public.podcast_folders (user_id);
    
    -- Enable RLS
    ALTER TABLE public.podcast_folders ENABLE ROW LEVEL SECURITY;
    
    -- Add policies
    CREATE POLICY "Users can view their own folders" 
      ON public.podcast_folders 
      FOR SELECT 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create folders" 
      ON public.podcast_folders 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own folders" 
      ON public.podcast_folders 
      FOR UPDATE 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own folders" 
      ON public.podcast_folders 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END
$$; 