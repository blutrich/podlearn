import { useAuth } from "@/lib/auth";
import { ReferralStats } from "@/components/user/ReferralStats";
import { SocialShare } from "@/components/user/SocialShare";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, FileText, Share2, Users, Gift, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="container py-4 sm:py-8 max-w-6xl mx-auto px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome back, {user?.email?.split('@')[0] || 'User'}!</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Start learning from podcasts with AI-powered transcriptions and lessons
        </p>
      </div>

      {/* Main Actions - Most Important */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Browse Podcasts - Primary Action */}
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="leading-tight">Search & Transcribe Podcasts</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Find any podcast episode and get AI-powered transcriptions and lessons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/browse" className="block">
              <Button size="lg" className="w-full text-base sm:text-lg py-4 sm:py-6">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Browse Podcasts
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* View Transcriptions - Secondary Action */}
        <Card className="border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <span className="leading-tight">Your Learning Library</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Access your learning content, lessons, and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/transcriptions" className="block">
              <Button variant="outline" size="lg" className="w-full text-base sm:text-lg py-4 sm:py-6 border-blue-200 hover:bg-blue-50">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                View Your Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Features - Less Prominent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Stats */}
        <Card className="order-1">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <span>Your Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Episodes</span>
              <span className="text-sm font-medium">View all →</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lessons</span>
              <span className="text-sm font-medium">Coming soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Referrals - Condensed */}
        <Card className="order-2">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              <span>Referrals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <ReferralStats />
            </div>
            <Link to="/referrals" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                <Gift className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Earn Credits
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Share - Condensed */}
        <Card className="order-3 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
              <span>Share</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Tell others about PodClass
            </p>
            <SocialShare 
              title="Check out PodClass!"
              url={window.location.origin}
              message="I've been using PodClass to learn from podcasts. It's amazing how it transforms podcast episodes into structured lessons!"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 