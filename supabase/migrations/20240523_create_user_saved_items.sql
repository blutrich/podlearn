-- Create user_saved_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  folder_id UUID REFERENCES public.podcast_folders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT user_saved_items_unique UNIQUE (user_id, item_id, item_type)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS user_saved_items_user_id_idx ON public.user_saved_items (user_id);
CREATE INDEX IF NOT EXISTS user_saved_items_item_type_idx ON public.user_saved_items (item_type);
CREATE INDEX IF NOT EXISTS user_saved_items_folder_id_idx ON public.user_saved_items (folder_id);

-- Add RLS policies
ALTER TABLE public.user_saved_items ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own saved items
CREATE POLICY "Users can view their own saved items" 
  ON public.user_saved_items 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own saved items
CREATE POLICY "Users can save items" 
  ON public.user_saved_items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own saved items
CREATE POLICY "Users can update their saved items" 
  ON public.user_saved_items 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own saved items
CREATE POLICY "Users can remove their saved items" 
  ON public.user_saved_items 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to create the table if it doesn't exist (for calling from client)
CREATE OR REPLACE FUNCTION public.create_user_saved_items_table()
RETURNS void AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_saved_items'
  ) THEN
    -- Create the table
    CREATE TABLE public.user_saved_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      item_id UUID NOT NULL,
      item_type TEXT NOT NULL,
      folder_id UUID REFERENCES public.podcast_folders(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      CONSTRAINT user_saved_items_unique UNIQUE (user_id, item_id, item_type)
    );
    
    -- Add indexes
    CREATE INDEX user_saved_items_user_id_idx ON public.user_saved_items (user_id);
    CREATE INDEX user_saved_items_item_type_idx ON public.user_saved_items (item_type);
    CREATE INDEX user_saved_items_folder_id_idx ON public.user_saved_items (folder_id);
    
    -- Enable RLS
    ALTER TABLE public.user_saved_items ENABLE ROW LEVEL SECURITY;
    
    -- Add policies
    CREATE POLICY "Users can view their own saved items" 
      ON public.user_saved_items 
      FOR SELECT 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can save items" 
      ON public.user_saved_items 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their saved items" 
      ON public.user_saved_items 
      FOR UPDATE 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can remove their saved items" 
      ON public.user_saved_items 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 