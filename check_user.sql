-- Check all user usage
SELECT 
    u.email,
    COALESCE(uc.credits, 0) as credits,
    COALESCE((SELECT COUNT(*) FROM user_episode_usage ueu WHERE ueu.user_id = u.id AND ueu.is_trial = true), 0) as trial_episodes_used,
    COALESCE((SELECT status FROM user_subscriptions us WHERE us.user_id = u.id), 'none') as subscription_status,
    (
        SELECT json_agg(json_build_object(
            'episode_id', ueu.episode_id,
            'is_trial', ueu.is_trial,
            'created_at', ueu.created_at
        ))
        FROM user_episode_usage ueu 
        WHERE ueu.user_id = u.id
    ) as episode_usage
FROM auth.users u
LEFT JOIN user_credits uc ON u.id = uc.user_id; 