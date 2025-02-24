import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Play, Coins, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LessonView } from "@/components/lessons/LessonView";
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

  // Extract key insights from lesson if available
  const getInsights = () => {
    if (!lesson) {
      console.log('No lesson available');
      return undefined;
    }
    
    console.log('Raw lesson content:', lesson.content); // Debug full content
    
    // Try to find any section that might contain key points
    const sections = [
      // Try Key Ideas (Comprehensive List) section
      lesson.content.match(/Key Ideas \(Comprehensive List\):([\s\S]*?)(?=\d+\.\s+|Core Concepts|$)/),
      // Try Key Ideas section
      lesson.content.match(/Key Ideas:([\s\S]*?)(?=Core Concepts|$)/),
      // Try Summary section
      lesson.content.match(/Summary \(Expanded\):([\s\S]*?)(?=Key Ideas|$)/),
      // Try numbered points anywhere in the content
      { groups: [null, lesson.content.match(/\d+\.\s+([^\n]+)/g)?.join('\n')] }
    ];
    
    // Try each section until we find one with content
    for (const match of sections) {
      if (match && match[1]) {
        const content = match[1].trim();
        if (content) {
          // Split into lines and clean up
          const ideas = content
            .split('\n')
            .map(line => line.trim())
            .map(line => line.replace(/^\d+\.\s*|^[•-]\s*/, '').trim()) // Remove numbers and bullets
            .filter(line => 
              line.length > 0 && 
              !line.startsWith('Key Ideas') &&
              !line.startsWith('Summary') &&
              line.length > 10 // Ensure the line has meaningful content
            )
            .slice(0, 3);
            
          console.log('Extracted ideas from section:', ideas);
          if (ideas.length > 0) {
            return ideas.join('\n');
          }
        }
      }
    }
    
    console.log('No insights found in any section');
    return undefined;
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
                <SocialShare 
                  episodeTitle={episodeTitle}
                  episodeUrl={window.location.href}
                  insights={getInsights()}
                />
              </>
            )}
            {isLoadingLesson && (
              <Button 
                variant="secondary"
                size="sm"
                disabled
              >
                <BookOpen className="w-4 h-4 mr-2 animate-pulse" />
                Loading Lesson...
              </Button>
            )}
          </>
        )}
      </div>

      {isTranscriptionVisible && transcription && (
        <div className="mt-4 p-4 bg-muted rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm">{transcription}</pre>
        </div>
      )}

      {isLessonVisible && lesson && (
        <div className="mt-4">
          <LessonView title={lesson.title} content={lesson.content} />
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
