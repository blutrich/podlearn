-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    credits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_episode_usage table
CREATE TABLE IF NOT EXISTS user_episode_usage (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL,
    episode_id uuid NOT NULL,
    is_trial BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_episode_usage_user_id ON user_episode_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_episode_usage_episode_id ON user_episode_usage(episode_id);

-- Create RLS policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_episode_usage ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own credits and subscriptions
CREATE POLICY "Users can view their own credits"
    ON user_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own episode usage"
    ON user_episode_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own episode usage
CREATE POLICY "Users can insert their own episode usage"
    ON user_episode_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only allow service role to manage credits and subscriptions
CREATE POLICY "Service role can manage credits"
    ON user_credits FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage subscriptions"
    ON user_subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Service role can manage all episode usage
CREATE POLICY "Service role can manage episode usage"
    ON user_episode_usage FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role'); 