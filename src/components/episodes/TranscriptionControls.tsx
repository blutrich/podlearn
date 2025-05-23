import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Play, Coins, Crown, ExternalLink, Copy, Share2, Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import LessonView from "@/components/lessons/LessonView";
import { useNavigate } from "react-router-dom";
import { SocialShare } from "./SocialShare";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TranscriptionControlsProps {
  isLoadingTranscription: boolean;
  isStartingTranscription: boolean;
  isGeneratingLesson: boolean;
  isLoadingLesson: boolean;
  transcription: string;
  lesson?: {
    title: string;
    content: string;
  };
  progress: number;
  remainingTrialEpisodes: number;
  hasActiveSubscription: boolean;
  credits: number;
  onStartTranscription: () => void;
  onViewTranscription: () => void;
  onCopyTranscription: () => void;
  onGenerateLesson: () => void;
  episodeTitle: string;
}

export const TranscriptionControls = ({
  isLoadingTranscription,
  isStartingTranscription,
  isGeneratingLesson,
  isLoadingLesson,
  transcription,
  lesson,
  progress,
  remainingTrialEpisodes,
  hasActiveSubscription,
  credits,
  onStartTranscription,
  onViewTranscription,
  onCopyTranscription,
  onGenerateLesson,
  episodeTitle,
}: TranscriptionControlsProps) => {
  const navigate = useNavigate();
  const [isTranscriptionCollapsed, setIsTranscriptionCollapsed] = useState(false);
  const [isLessonVisible, setIsLessonVisible] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const hasTranscription = Boolean(transcription);

  // Detect Hebrew content in transcription
  const hebrewRegex = /[\u0590-\u05FF]/;
  const isHebrewTranscription = hasTranscription && hebrewRegex.test(transcription);

  const handleToggleTranscription = () => {
    setIsTranscriptionCollapsed(!isTranscriptionCollapsed);
    onViewTranscription();
  };

  const handleViewLesson = () => {
    setIsLessonVisible(!isLessonVisible);
  };

  const formatTranscription = (text: string) => {
    // Detect Hebrew content
    const hebrewRegex = /[\u0590-\u05FF]/;
    const isHebrew = hebrewRegex.test(text);
    
    // Enhanced formatting to improve readability with better spacing
    return text
      .split('\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map((paragraph, index) => {
        // Check if this is a timestamp line like "[0:00 - 0:02] Speaker A:"
        const timestampMatch = paragraph.match(/^\[([^\]]+)\]\s*(Speaker [A-Z]|[^:]+):\s*(.*)$/);
        
        if (timestampMatch) {
          const [, timestamp, speaker, content] = timestampMatch;
          return (
            <div key={index} className={`mb-3 group ${isHebrew ? 'rtl' : ''}`} dir={isHebrew ? "rtl" : "ltr"}>
              {/* Timestamp and Speaker Header - More compact with RTL support */}
              <div className={`flex items-center gap-2 mb-2 pb-1 border-b border-border/20 ${isHebrew ? 'flex-row-reverse' : ''}`}>
                <div className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-mono rounded">
                  {timestamp}
                </div>
                <div className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium rounded">
                  {speaker}
                </div>
              </div>
              
              {/* Content - Reduced padding with RTL support */}
              <div className={`border-primary/20 ${isHebrew ? 'pr-3 border-r text-right' : 'pl-3 border-l'}`}>
                <p className={`text-sm leading-6 text-foreground ${isHebrew ? 'font-hebrew text-right' : 'font-[ui-serif,Georgia,Cambria,serif]'}`}>
                  {content}
                </p>
              </div>
            </div>
          );
        }
        
        // Regular paragraph without timestamp - More compact with RTL support
        return (
          <div key={index} className={`mb-3 ${isHebrew ? 'rtl' : ''}`} dir={isHebrew ? "rtl" : "ltr"}>
            <p className={`text-sm leading-6 text-foreground/90 ${isHebrew ? 'font-hebrew text-right' : 'font-[ui-serif,Georgia,Cambria,serif]'}`}>
              {paragraph}
            </p>
          </div>
        );
      });
  };

  const getInsights = () => {
    if (!lesson) return '';
    
    // Extract key points from the lesson content
    const content = lesson.content;
    const keyPointsMatch = content.match(/Key Points:([\s\S]*?)(?:\n\n|$)/);
    const summaryMatch = content.match(/Summary:([\s\S]*?)(?:\n\n|$)/);
    
    if (keyPointsMatch && keyPointsMatch[1]) {
      return keyPointsMatch[1].trim();
    } else if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim();
    } else {
      // Fallback to first few sentences if no key points or summary found
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return sentences.slice(0, 3).join('. ') + '.';
    }
  };

  // Get a preview of the transcription for sharing
  const getTranscriptionPreview = () => {
    if (!transcription) return '';
    
    // Get first 200 characters of the transcription
    const preview = transcription.substring(0, 200).trim();
    return preview;
  };

  // Track when a share is completed
  const handleShareComplete = () => {
    setShareCount(prev => prev + 1);
    // In a real implementation, you might want to track this in the database
    // or give the user a reward after a certain number of shares
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Action buttons for when no transcription exists */}
      {!hasTranscription && !isStartingTranscription && (
        <div className="rounded-lg border border-border/50 bg-card p-3">
          <div className="flex flex-col gap-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={onStartTranscription}
              disabled={isStartingTranscription}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Transcription
            </Button>
            <div className="flex flex-wrap items-center gap-1 text-xs">
              {hasActiveSubscription ? (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5">
                  <Crown className="w-3 h-3 mr-1" />
                  Unlimited
                </Badge>
              ) : remainingTrialEpisodes > 0 ? (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {remainingTrialEpisodes} free trial left
                </Badge>
              ) : credits > 0 ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5">
                  <Coins className="w-3 h-3 mr-1" />
                  {credits} credit{credits !== 1 ? 's' : ''}
                </Badge>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 w-full">
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">No credits</Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="text-xs h-6"
                  >
                    <Coins className="w-3 h-3 mr-1" />
                    Buy Credits
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transcription Display - Compact version */}
      {hasTranscription && (
        <div className={`rounded-lg border border-border/50 bg-card ${isHebrewTranscription ? 'rtl' : ''}`} dir={isHebrewTranscription ? "rtl" : "ltr"}>
          <div className="p-3 border-b border-border/30">
            <div className={`flex items-center justify-between gap-2 ${isHebrewTranscription ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 min-w-0 ${isHebrewTranscription ? 'flex-row-reverse' : ''}`}>
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className={`font-medium text-sm truncate ${isHebrewTranscription ? 'font-hebrew' : ''}`}>
                  {isHebrewTranscription ? "תמליל הפרק" : "Episode Transcription"}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCopyTranscription}
                  className="h-7 px-2 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {isHebrewTranscription ? "העתק" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleTranscription}
                  className="h-7 px-2 text-xs"
                >
                  {isTranscriptionCollapsed ? (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      {isHebrewTranscription ? "הצג" : "Show"}
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      {isHebrewTranscription ? "הסתר" : "Hide"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          {!isTranscriptionCollapsed && (
            <div className="p-3">
              <div className={`flex flex-wrap items-center gap-2 mb-2 text-xs text-muted-foreground ${isHebrewTranscription ? 'flex-row-reverse' : ''}`}>
                <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${isHebrewTranscription ? 'font-hebrew' : ''}`}>
                  {isHebrewTranscription ? "תמליל AI בעברית" : "AI Transcription"}
                </Badge>
                <span>•</span>
                <span>{transcription.length.toLocaleString()} {isHebrewTranscription ? "תווים" : "characters"}</span>
              </div>
              <div className="max-h-80 overflow-y-auto text-sm space-y-2 pr-1">
                {formatTranscription(transcription)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lesson Section - Compact version */}
      {hasTranscription && (
        <div className="rounded-lg border border-border/50 bg-card">
          <div className="p-3 border-b border-border/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="font-medium text-sm truncate">Key Insights</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!lesson && !isLoadingLesson && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={onGenerateLesson}
                    disabled={isGeneratingLesson}
                    className="bg-purple-600 hover:bg-purple-700 h-7 px-2 text-xs"
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    {isGeneratingLesson ? "Generating..." : "Generate"}
                  </Button>
                )}
                {lesson && (
                  <Button 
                    variant={isLessonVisible ? "secondary" : "default"}
                    size="sm"
                    className={`h-7 px-2 text-xs ${isLessonVisible ? "" : "bg-purple-600 hover:bg-purple-700"}`}
                    onClick={handleViewLesson}
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    {isLessonVisible ? "Hide" : "Show"}
                  </Button>
                )}
              </div>
            </div>
          </div>
          {isLoadingLesson && (
            <div className="p-4">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-xs text-muted-foreground">Extracting insights...</p>
                </div>
              </div>
            </div>
          )}
          {!lesson && !isLoadingLesson && !isGeneratingLesson && (
            <div className="p-4 text-center">
              <BookOpen className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Transform this episode into insights</p>
              <p className="text-xs text-muted-foreground mt-1">Get takeaways and applications</p>
            </div>
          )}
          {isLessonVisible && lesson && (
            <div className="p-2 sm:p-3">
              <div className="mb-2">
                <div className="flex flex-wrap items-center gap-1 mb-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5">AI Insights</Badge>
                  <SocialShare 
                    episodeTitle={episodeTitle}
                    episodeUrl={window.location.href}
                    insights={getInsights()}
                    transcriptionPreview={getTranscriptionPreview()}
                    referralBonus={shareCount < 3}
                    onShareComplete={handleShareComplete}
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto pr-1">
                <LessonView episode={lesson.content} />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Progress indicators - Compact */}
      {(isStartingTranscription || isGeneratingLesson) && (
        <div className="rounded-lg border border-border/50 bg-card p-2">
          <div className="space-y-1">
            <Progress value={progress} className="h-1" />
            <p className="text-xs text-muted-foreground text-center">
              {isStartingTranscription && (
                <>
                  {progress < 30 && "Starting transcription..."}
                  {progress >= 30 && progress < 100 && "Processing audio..."}
                  {progress === 100 && "Transcription complete!"}
                </>
              )}
              {isGeneratingLesson && "Generating lesson..."}
            </p>
          </div>
        </div>
      )}
      
      {/* Upgrade prompt - Compact */}
      {!hasTranscription && !hasActiveSubscription && credits === 0 && !isStartingTranscription && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium flex items-center text-primary text-sm">
                <Coins className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">Get More Episodes</span>
              </h4>
              <p className="text-xs text-muted-foreground">Purchase credits or subscribe</p>
            </div>
            <Button 
              onClick={() => navigate('/pricing')}
              className="bg-primary hover:bg-primary/90 flex-shrink-0"
              size="sm"
            >
              Buy Credits
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
