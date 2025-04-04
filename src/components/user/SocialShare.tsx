import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Twitter, Facebook, Linkedin, Copy, Check, Share2 } from "lucide-react";
import { useReferrals } from "@/hooks/useReferrals";

interface SocialShareProps {
  title: string;
  url: string;
  message?: string;
  includeReferralLink?: boolean;
}

export function SocialShare({ 
  title, 
  url, 
  message = "", 
  includeReferralLink = true 
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const { referralLink } = useReferrals();
  
  const shareUrl = includeReferralLink ? `${url}?ref=${referralLink.split('ref=')[1] || ''}` : url;
  const shareMessage = `${message} ${shareUrl}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const openShareWindow = (platform: string) => {
    let shareUrl = '';
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedMessage}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea 
          value={shareMessage}
          readOnly
          className="resize-none h-24"
        />
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openShareWindow('twitter')}
              className="flex items-center gap-1"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openShareWindow('facebook')}
              className="flex items-center gap-1"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openShareWindow('linkedin')}
              className="flex items-center gap-1"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            className="flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      
      {includeReferralLink && (
        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm font-medium mb-2">Your referral link is included</p>
          <p className="text-xs text-muted-foreground">
            When someone signs up using your link, you'll earn credits!
          </p>
        </div>
      )}
    </div>
  );
} 