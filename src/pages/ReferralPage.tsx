import { ReferralTracker } from "@/components/user/ReferralTracker";
import { useReferrals } from "@/hooks/useReferrals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Users, Gift, Award, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { SocialShare } from "@/components/episodes/SocialShare";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ReferralPage() {
  const { user } = useAuth();
  const { stats, referralLink, copyReferralLink } = useReferrals();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Content for sharing
  const appUrl = window.location.origin;
  const shareTitle = "PodClass - AI Podcast Learning Assistant";
  const shareDescription = "I've been using PodClass to learn from podcasts. Join me and get extra free trial episodes!";

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Refer Friends & Earn Rewards</h1>
      <p className="text-muted-foreground mb-8">
        Share PodClass with friends and earn free credits when they join
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main referral tracker */}
        <div className="md:col-span-2">
          <ReferralTracker />
        </div>

        {/* How it works */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Simple steps to earn rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Share Your Link</h3>
                  <p className="text-sm text-muted-foreground">
                    Copy your unique referral link and share it with friends
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Friends Sign Up</h3>
                  <p className="text-sm text-muted-foreground">
                    When friends use your link to sign up, they get an extra free trial episode
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Earn Credits</h3>
                  <p className="text-sm text-muted-foreground">
                    You earn 1 free credit for each friend who signs up using your link
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rewards</CardTitle>
              <CardDescription>What you can earn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">1 Credit Per Referral</h3>
                  <p className="text-sm text-muted-foreground">
                    Each successful referral earns you 1 credit to use on any episode
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Bonus Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Refer 5 friends and get a special bonus reward
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Community Benefits</h3>
                  <p className="text-sm text-muted-foreground">
                    More users means more shared transcriptions for everyone
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Social sharing benefits */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Community Transcription Benefits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Shared Transcriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                When any user transcribes a podcast episode, the transcription becomes available to all users with access rights.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>No need to re-transcribe popular episodes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Save your credits for unique content</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Instant access to pre-transcribed episodes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Network Effects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                The more users join PodClass, the more valuable it becomes for everyone in the community.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>More users = more transcribed episodes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Diverse content from different interests</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Community-driven content discovery</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Social Sharing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Share your insights and lessons from podcasts with your network on social media.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Share key takeaways on social media</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Customizable sharing messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Include your referral link to earn credits</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to action */}
      {user ? (
        <div className="mt-12 text-center">
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Share2 className="h-5 w-5 mr-2" />
                Start Sharing Now
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share PodClass</DialogTitle>
                <DialogDescription>
                  Share with friends and earn rewards when they join!
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4">
                <SocialShare 
                  episodeTitle={shareTitle}
                  episodeUrl={appUrl}
                  insights={shareDescription}
                  referralBonus={true}
                  onShareComplete={() => setShareDialogOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <Card className="mt-12 bg-primary text-primary-foreground">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-8">
            <div>
              <h3 className="text-xl font-bold mb-2">Join PodClass Today</h3>
              <p className="text-primary-foreground/80 max-w-md">
                Sign up now to get 2 free trial episodes and start earning rewards by referring friends.
              </p>
            </div>
            <Button 
              size="lg" 
              variant="secondary" 
              className="mt-4 md:mt-0"
              onClick={() => navigate('/signup')}
            >
              Sign Up Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 