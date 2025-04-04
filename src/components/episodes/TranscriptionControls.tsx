import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Play, Coins, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import LessonView from "@/components/lessons/LessonView";
import { useNavigate } from "react-router-dom";
import { SocialShare } from "./SocialShare";

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
  const [isTranscriptionVisible, setIsTranscriptionVisible] = useState(false);
  const [isLessonVisible, setIsLessonVisible] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const hasTranscription = Boolean(transcription);

  const handleViewTranscription = () => {
    setIsTranscriptionVisible(!isTranscriptionVisible);
    setIsLessonVisible(false);
    onViewTranscription();
  };

  const handleViewLesson = () => {
    setIsLessonVisible(!isLessonVisible);
    setIsTranscriptionVisible(false);
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {!hasTranscription && !isStartingTranscription && (
          <>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={onStartTranscription}
              disabled={isStartingTranscription}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Transcription
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasActiveSubscription ? (
                <span className="flex items-center">
                  <Crown className="w-4 h-4 mr-1 text-yellow-500" />
                  Unlimited Access
                </span>
              ) : remainingTrialEpisodes > 0 ? (
                <span>
                  {remainingTrialEpisodes} free trial episode{remainingTrialEpisodes !== 1 ? 's' : ''} remaining
                </span>
              ) : credits > 0 ? (
                <span className="flex items-center">
                  <Coins className="w-4 h-4 mr-1 text-yellow-500" />
                  {credits} credit{credits !== 1 ? 's' : ''} remaining
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-destructive">
                    No credits remaining
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/pricing')}
                    className="ml-2"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Buy Credits
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
        
        {hasTranscription && (
          <>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleViewTranscription}
              disabled={isLoadingTranscription}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isLoadingTranscription ? "Loading..." : isTranscriptionVisible ? "Hide Transcription" : "View Transcription"}
            </Button>
            {isTranscriptionVisible && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onCopyTranscription}
              >
                Copy Transcription
              </Button>
            )}
            {!lesson && !isLoadingLesson && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onGenerateLesson}
                disabled={isGeneratingLesson}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {isGeneratingLesson ? "Generating..." : "Generate Lesson"}
              </Button>
            )}
            {lesson && !isLoadingLesson && (
              <>
                <Button 
                  variant={isLessonVisible ? "secondary" : "default"}
                  size="sm"
                  className={`${isLessonVisible ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                  onClick={handleViewLesson}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {isLessonVisible ? "Hide Lesson" : "View Lesson"}
                </Button>
                <div className="inline-block md:hidden">
                  <SocialShare 
                    episodeTitle={episodeTitle}
                    episodeUrl={window.location.href}
                    insights={getInsights()}
                    transcriptionPreview={getTranscriptionPreview()}
                    referralBonus={shareCount < 3} // Enable referral bonus for first 3 shares
                    onShareComplete={handleShareComplete}
                  />
                </div>
                <div className="hidden md:inline-block">
                  <SocialShare 
                    episodeTitle={episodeTitle}
                    episodeUrl={window.location.href}
                    insights={getInsights()}
                    transcriptionPreview={getTranscriptionPreview()}
                    referralBonus={shareCount < 3} // Enable referral bonus for first 3 shares
                    onShareComplete={handleShareComplete}
                  />
                </div>
              </>
            )}
            {isLoadingLesson && (
              <Button 
                variant="secondary"
                size="sm"
                disabled
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Loading Lesson...
              </Button>
            )}
          </>
        )}
      </div>

      {isTranscriptionVisible && transcription && (
        <div className="mt-4 bg-muted rounded-lg overflow-x-auto max-h-[600px] overflow-y-auto w-full">
          <pre className="whitespace-pre-wrap text-sm sm:text-base font-normal p-3 sm:p-4 pl-2 sm:pl-3 w-full">{transcription}</pre>
        </div>
      )}

      {isLessonVisible && lesson && (
        <div className="mt-4 w-full">
          <LessonView episode={lesson.content} />
        </div>
      )}
      
      {(isStartingTranscription || isGeneratingLesson) && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
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
      )}
    </div>
  );
};
