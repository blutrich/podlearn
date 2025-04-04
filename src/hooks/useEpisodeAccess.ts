import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Episode = Database['public']['Tables']['episodes']['Insert'];

export function useEpisodeAccess() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [trialEpisodesUsed, setTrialEpisodesUsed] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [credits, setCredits] = useState(0);

  // Load user's access status
  useEffect(() => {
    if (!user) return;

    const loadAccessStatus = async () => {
      try {
        setLoading(true);
        
        // Get trial episodes count
        const { data: usageData, error: usageError } = await supabase
          .from('user_episode_usage')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_trial', true);

        if (usageError) throw usageError;
        setTrialEpisodesUsed(usageData?.length || 0);

        // Check subscription status
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (subError) throw subError;
        setHasActiveSubscription(!!subData);

        // Get credits
        const { data: creditData, error: creditError } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', user.id)
          .maybeSingle();

        if (creditError) throw creditError;
        setCredits(creditData?.credits || 0);

      } catch (error) {
        console.error('Error loading access status:', error);
        toast.error('Failed to load access status');
      } finally {
        setLoading(false);
      }
    };

    loadAccessStatus();
  }, [user]);

  const checkEpisodeAccess = async (originalEpisodeId: string) => {
    if (!user) {
      toast.error('Please log in to access episodes');
      return false;
    }

    try {
      setLoading(true);

      // First get the episode's UUID
      const { data: episodes, error: episodeError } = await supabase
        .from('episodes')
        .select('id')
        .eq('original_id', originalEpisodeId.toString());

      if (episodeError) {
        console.error('Database error when fetching episode:', episodeError);
        toast.error('Unable to verify episode access. Please try again later.');
        return false;
      }
      
      if (!episodes || episodes.length === 0) {
        // Episode doesn't exist, create it
        const newEpisodeData: Episode = {
          original_id: originalEpisodeId.toString(),
          title: 'Episode ' + originalEpisodeId, // Temporary title
          podcast_id: 0, // Temporary podcast_id
          audio_url: null // Will be updated later
        };

        const { data: newEpisode, error: insertError } = await supabase
          .from('episodes')
          .insert(newEpisodeData)
          .select('id')
          .single();

        if (insertError) throw insertError;
        if (!newEpisode) throw new Error('Failed to create episode');
        
        const episodeId = newEpisode.id;
        
        // Check if episode was already processed
        const { data: existingUsage, error: usageError } = await supabase
          .from('user_episode_usage')
          .select('is_trial')
          .eq('user_id', user.id)
          .eq('episode_id', episodeId)
          .maybeSingle();

        if (usageError) throw usageError;

        // If already processed, allow access
        if (existingUsage) return true;

        // If has active subscription, grant access
        if (hasActiveSubscription) {
          await recordEpisodeUsage(episodeId, false);
          return true;
        }

        // Check if can use trial
        if (trialEpisodesUsed < 2) {
          await recordEpisodeUsage(episodeId, true);
          setTrialEpisodesUsed(prev => prev + 1);
          return true;
        }

        // Check if has credits
        if (credits > 0) {
          await useCredit(episodeId);
          return true;
        }

        // No access available
        return false;
      } else {
        const episodeId = episodes[0].id;
        
        // Check if episode was already processed
        const { data: existingUsage, error: usageError } = await supabase
          .from('user_episode_usage')
          .select('is_trial')
          .eq('user_id', user.id)
          .eq('episode_id', episodeId)
          .maybeSingle();

        if (usageError) throw usageError;

        // If already processed, allow access
        if (existingUsage) return true;

        // If has active subscription, grant access
        if (hasActiveSubscription) {
          await recordEpisodeUsage(episodeId, false);
          return true;
        }

        // Check if can use trial
        if (trialEpisodesUsed < 2) {
          await recordEpisodeUsage(episodeId, true);
          setTrialEpisodesUsed(prev => prev + 1);
          return true;
        }

        // Check if has credits
        if (credits > 0) {
          await useCredit(episodeId);
          return true;
        }

        // No access available
        return false;
      }
    } catch (error) {
      // Enhanced error logging with more context
      console.error('Error checking episode access:', {
        error,
        userId: user.id,
        episodeId: originalEpisodeId,
        timestamp: new Date().toISOString()
      });
      
      // More specific user-facing error message
      if (error instanceof Error && error.message.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error instanceof Error && error.message.includes('permission')) {
        toast.error('Permission error. You may not have access to this feature.');
      } else {
        toast.error('Unable to process this episode. Our team has been notified.');
      }
      
      // Graceful fallback - deny access on error
      return false;
    } finally {
      setLoading(false);
    }
  };

  const recordEpisodeUsage = async (episodeId: string, isTrial: boolean) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('user_episode_usage')
        .insert({
          user_id: user.id,
          episode_id: episodeId,
          is_trial: isTrial
        });

      if (error) {
        console.error('Failed to record episode usage:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error recording episode usage:', {
        error,
        userId: user.id,
        episodeId,
        isTrial,
        timestamp: new Date().toISOString()
      });
      // Don't show toast here as this is a background operation
      // But we still log it for monitoring
    }
  };

  const useCredit = async (episodeId: string) => {
    if (!user?.id) return;
    
    try {
      // Use a transaction to ensure both operations succeed or fail together
      const { error } = await supabase.rpc('use_credit_and_record_usage', {
        p_user_id: user.id,
        p_episode_id: episodeId
      });
      
      if (error) {
        console.error('Failed to use credit:', error);
        throw error;
      }
      
      // Update local state
      setCredits(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error using credit:', {
        error,
        userId: user.id,
        episodeId,
        timestamp: new Date().toISOString()
      });
      toast.error('Failed to process credit. Please try again later.');
      throw error;
    }
  };

  return {
    loading,
    trialEpisodesUsed,
    hasActiveSubscription,
    credits,
    checkEpisodeAccess,
    remainingTrialEpisodes: Math.max(0, 2 - trialEpisodesUsed)
  };
} 