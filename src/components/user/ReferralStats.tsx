import { useReferrals } from "@/hooks/useReferrals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gift, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralStatsProps {
  minimal?: boolean;
}

export function ReferralStats({ minimal = false }: ReferralStatsProps) {
  const { stats, loading } = useReferrals();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (minimal) {
    return (
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{stats.totalReferrals} Referrals</span>
        </div>
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{stats.creditsEarned} Credits</span>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Referrals</CardTitle>
        <CardDescription>Track your referral performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg">
            <Users className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold">{stats.totalReferrals}</span>
            <span className="text-xs text-muted-foreground">Total Referrals</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg">
            <Award className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold">{stats.completedReferrals}</span>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg">
            <Gift className="h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold">{stats.creditsEarned}</span>
            <span className="text-xs text-muted-foreground">Credits Earned</span>
          </div>
        </div>
        
        {stats.totalReferrals > 0 && stats.totalReferrals < 5 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Refer {5 - stats.totalReferrals} more friends to earn a bonus reward!</p>
          </div>
        )}
        
        {stats.totalReferrals >= 5 && (
          <div className="mt-4 text-center text-sm">
            <p className="font-medium text-primary">
              You've unlocked the bonus reward! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 