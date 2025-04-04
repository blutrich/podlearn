import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Share2, Gift, Users, Award, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Referral {
  id: string;
  referred_user: {
    username: string;
  } | null;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
}

export function ReferralTracker() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // Generate referral link
  const referralLink = user 
    ? `${window.location.origin}?ref=${user.id}`
    : '';
  
  // Load referrals data
  useEffect(() => {
    if (!user) return;
    
    const loadReferrals = async () => {
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
              userData.map(u => [u.id, { username: u.username || 'Anonymous User' }])
            );
          }
        }
        
        // Add user details to referrals
        const enhancedReferrals: Referral[] = data?.map(referral => ({
          ...referral,
          referred_user: userDetails[referral.referred_id] || null,
          status: referral.status as 'pending' | 'completed'
        })) || [];
        
        setReferrals(enhancedReferrals);
        
        // Count completed referrals for credits earned
        const completed = enhancedReferrals.filter(r => r.status === 'completed') || [];
        setCreditsEarned(completed.length);
        
      } catch (error) {
        console.error('Error loading referrals:', error);
        toast.error('Failed to load referrals');
      } finally {
        setLoading(false);
      }
    };
    
    loadReferrals();
  }, [user]);
  
  // Copy referral link to clipboard
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Calculate progress to next reward
  const nextRewardAt = 5; // Get next reward at 5 referrals
  const progress = Math.min(100, (referrals.length / nextRewardAt) * 100);
  const remainingForReward = Math.max(0, nextRewardAt - referrals.length);
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refer Friends & Earn Rewards</CardTitle>
          <CardDescription>Sign in to start referring friends and earning credits</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" disabled>Sign in to get your referral link</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Refer Friends & Earn
            </CardTitle>
            <CardDescription>Share PodClass and earn free credits</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Gift className="h-3 w-3" />
            {creditsEarned} Credits Earned
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress to next reward */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to next reward</span>
            <span className="font-medium">{referrals.length}/{nextRewardAt} Referrals</span>
          </div>
          <Progress value={progress} className="h-2" />
          {remainingForReward > 0 ? (
            <p className="text-sm text-muted-foreground">
              Refer {remainingForReward} more friend{remainingForReward !== 1 ? 's' : ''} to earn your next free credit!
            </p>
          ) : (
            <p className="text-sm text-green-600 font-medium">
              You've reached your referral goal! Keep referring for more rewards.
            </p>
          )}
        </div>
        
        {/* Referral link */}
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Your referral link</label>
          <div className="flex items-center gap-2">
            <div className="bg-muted px-3 py-2 rounded-md text-sm flex-1 truncate">
              {referralLink}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={copyReferralLink}
              className="flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        
        {/* Referral stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{referrals.length}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <Award className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{creditsEarned}</p>
            <p className="text-xs text-muted-foreground">Credits Earned</p>
          </div>
        </div>
        
        {/* Recent referrals */}
        {referrals.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Recent Referrals</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {referrals.slice(0, 5).map((referral) => (
                <div key={referral.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                  <div className="text-sm truncate flex-1">
                    {referral.referred_user?.username || 'Anonymous User'}
                  </div>
                  <Badge variant={referral.status === 'completed' ? 'default' : 'outline'}>
                    {referral.status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={copyReferralLink}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
        <Button>
          <Share2 className="h-4 w-4 mr-2" />
          Share Now
        </Button>
      </CardFooter>
    </Card>
  );
} 