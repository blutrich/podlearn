-- Add user_referrals table for tracking referrals between users
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) NOT NULL,
  referred_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referrer_id, referred_id)
);

-- Add RLS policies for user_referrals
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer or referred)
CREATE POLICY "Users can view their own referrals" ON public.user_referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR 
    auth.uid() = referred_id
  );

-- Only the system can insert/update referrals
CREATE POLICY "System can manage referrals" ON public.user_referrals
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
  );

-- Function to process a referral when a new user signs up
CREATE OR REPLACE FUNCTION public.process_referral(
  p_referrer_id UUID,
  p_referred_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_referral UUID;
BEGIN
  -- Check if this referral already exists
  SELECT id INTO v_existing_referral
  FROM public.user_referrals
  WHERE referrer_id = p_referrer_id AND referred_id = p_referred_id;
  
  -- If it doesn't exist, create it
  IF v_existing_referral IS NULL THEN
    INSERT INTO public.user_referrals (
      referrer_id,
      referred_id,
      status,
      created_at
    ) VALUES (
      p_referrer_id,
      p_referred_id,
      'pending',
      now()
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to complete a referral and award credits
CREATE OR REPLACE FUNCTION public.complete_referral(
  p_referred_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral_id UUID;
  v_referrer_id UUID;
BEGIN
  -- Find the pending referral
  SELECT id, referrer_id INTO v_referral_id, v_referrer_id
  FROM public.user_referrals
  WHERE referred_id = p_referred_id AND status = 'pending'
  LIMIT 1;
  
  -- If no pending referral found, exit
  IF v_referral_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the referral to completed
  UPDATE public.user_referrals
  SET status = 'completed',
      completed_at = now()
  WHERE id = v_referral_id;
  
  -- Award a credit to the referrer
  INSERT INTO public.user_credits (user_id, credits, source)
  VALUES (v_referrer_id, 1, 'referral')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits = user_credits.credits + 1,
    updated_at = now();
  
  -- Award an extra free trial to the referred user
  INSERT INTO public.user_preferences (user_id, additional_trial_episodes)
  VALUES (p_referred_id, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    additional_trial_episodes = COALESCE(user_preferences.additional_trial_episodes, 0) + 1,
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- Add a trigger to process referrals on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_with_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Check if the new user has a referral code in their metadata
  IF NEW.raw_app_meta_data->>'referral' IS NOT NULL THEN
    v_referrer_id := (NEW.raw_app_meta_data->>'referral')::UUID;
    
    -- Process the referral
    PERFORM public.process_referral(v_referrer_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_referral();

-- Add a column to user_credits to track the source of credits
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'purchase';

-- Add a column to user_preferences to track additional trial episodes from referrals
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS additional_trial_episodes INTEGER DEFAULT 0;

-- Function to use credit and record usage with transaction
CREATE OR REPLACE FUNCTION public.use_credit_and_record_usage(
  p_user_id UUID,
  p_episode_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  -- Start a transaction
  BEGIN
    -- Check if user has credits
    SELECT credits INTO v_credits
    FROM public.user_credits
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the row
    
    IF v_credits IS NULL OR v_credits <= 0 THEN
      RETURN FALSE;
    END IF;
    
    -- Deduct a credit
    UPDATE public.user_credits
    SET credits = credits - 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Record the episode usage
    INSERT INTO public.user_episode_usage (
      user_id,
      episode_id,
      is_trial,
      created_at
    ) VALUES (
      p_user_id,
      p_episode_id,
      FALSE,
      now()
    );
    
    RETURN TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$; 