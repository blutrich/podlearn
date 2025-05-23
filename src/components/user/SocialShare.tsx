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
    <div className="space-y-3">
      <div className="space-y-3">
        <Textarea 
          value={shareMessage}
          readOnly
          className="resize-none h-20 text-xs leading-relaxed overflow-hidden"
        />
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openShareWindow('twitter')}
              className="text-xs px-2 py-1 h-8"
            >
              <Twitter className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Twitter</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openShareWindow('facebook')}
              className="text-xs px-2 py-1 h-8"
            >
              <Facebook className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Facebook</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openShareWindow('linkedin')}
              className="text-xs px-2 py-1 h-8"
            >
              <Linkedin className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">LinkedIn</span>
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            className="text-xs px-2 py-1 h-8 w-full"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </div>
      
      {includeReferralLink && (
        <div className="bg-muted/50 p-2 rounded-md">
          <p className="text-xs font-medium mb-1">Your referral link is included</p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            When someone signs up using your link, you'll earn credits!
          </p>
        </div>
      )}
    </div>
  );
} 