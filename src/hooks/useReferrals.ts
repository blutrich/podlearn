import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Referral {
  id: string;
  referred_user: {
    username: string;
  } | null;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
  referred_id: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  creditsEarned: number;
}

export function useReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    creditsEarned: 0
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Generate referral link
  const referralLink = user 
    ? `${window.location.origin}?ref=${user.id}`
    : '';

  // Load referrals data
  const loadReferrals = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get referrals where current user is the referrer
      const { data, error } = await supabase
        .from('user_referrals')
        .select(`
          id,
          status,
          created_at,
          completed_at,
          referred_id
        `)
        .eq('referrer_id', user.id);
        
      if (error) throw error;

      // Fetch user details for referred users
      const referredIds = data?.map(r => r.referred_id) || [];
      let userDetails: Record<string, { username: string }> = {};
      
      if (referredIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', referredIds);
          
        if (!userError && userData) {
          userDetails = Object.fromEntries(
            userData.map(u => [u.id, { username: u.username || 'Unknown User' }])
          );
        }
      }
      
      // Add user details to referrals
      const enhancedReferrals: Referral[] = data?.map(referral => ({
        ...referral,
        referred_user: userDetails[referral.referred_id] || null,
        status: referral.status as 'pending' | 'completed'
      })) || [];
      
      // Set referrals data
      setReferrals(enhancedReferrals);
      
      // Calculate stats
      const completed = enhancedReferrals.filter(r => r.status === 'completed') || [];
      const pending = enhancedReferrals.filter(r => r.status === 'pending') || [];
      
      setStats({
        totalReferrals: enhancedReferrals.length || 0,
        completedReferrals: completed.length,
        pendingReferrals: pending.length,
        creditsEarned: completed.length // Assuming 1 credit per completed referral
      });
      
    } catch (error) {
      console.error('Error loading referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load referrals on mount and when user changes
  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  // Process a referral
  const processReferral = useCallback(async (referredId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.functions.invoke('process-referral', {
        body: {
          referrerId: user.id,
          referredId,
          action: 'process'
        }
      });
      
      if (error) throw error;
      
      // Reload referrals to get updated data
      loadReferrals();
      
      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      toast.error('Failed to process referral');
      return false;
    }
  }, [user, loadReferrals]);

  // Complete a referral
  const completeReferral = useCallback(async (referredId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.functions.invoke('process-referral', {
        body: {
          referrerId: user.id,
          referredId,
          action: 'complete'
        }
      });
      
      if (error) throw error;
      
      // Reload referrals to get updated data
      loadReferrals();
      toast.success('Referral completed! You earned a credit.');
      
      return true;
    } catch (error) {
      console.error('Error completing referral:', error);
      toast.error('Failed to complete referral');
      return false;
    }
  }, [user, loadReferrals]);

  // Copy referral link to clipboard
  const copyReferralLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

  // Check for pending referral in URL and process it
  useEffect(() => {
    if (!user) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && refCode !== user.id) {
      // Process the referral
      processReferral(refCode);
      
      // Remove the referral code from URL to prevent repeated processing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, [user, processReferral]);

  return {
    referrals,
    stats,
    loading,
    copied,
    referralLink,
    copyReferralLink,
    processReferral,
    completeReferral,
    loadReferrals
  };
} 