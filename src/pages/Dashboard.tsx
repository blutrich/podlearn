import { useAuth } from "@/lib/auth";
import { ReferralStats } from "@/components/user/ReferralStats";
import { SocialShare } from "@/components/user/SocialShare";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Headphones, BookOpen, Share2, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back, {user?.email?.split('@')[0] || 'User'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2 space-y-8">
          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track your recent podcast listening and learning activity.
                </p>
                <Link to="/browse" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Browse Podcasts
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View your learning progress and completed lessons.
                </p>
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    View Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Share Your Insights
              </CardTitle>
              <CardDescription>
                Share your favorite podcast lessons with friends and on social media
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialShare 
                title="Check out this amazing podcast lesson I found!"
                url={window.location.origin}
                message="I've been using PodClass to learn from podcasts. It's amazing how it transforms podcast episodes into structured lessons!"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Referral stats */}
          <ReferralStats />

          {/* Referral CTA */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-2">Earn Free Credits</h3>
              <p className="text-primary-foreground/80 mb-4">
                Invite friends to PodClass and earn free credits for each successful referral.
              </p>
              <Link to="/referrals">
                <Button 
                  variant="secondary" 
                  className="w-full"
                >
                  View Referral Program
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 