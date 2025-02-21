import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LessonView } from "@/components/lessons/LessonView";

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
  onStartTranscription: () => void;
  onViewTranscription: () => void;
  onCopyTranscription: () => void;
  onGenerateLesson: () => void;
}

export const TranscriptionControls = ({
  isLoadingTranscription,
  isStartingTranscription,
  isGeneratingLesson,
  isLoadingLesson,
  transcription,
  lesson,
  progress,
  onStartTranscription,
  onViewTranscription,
  onCopyTranscription,
  onGenerateLesson,
}: TranscriptionControlsProps) => {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {!hasTranscription && !isStartingTranscription && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onStartTranscription}
            disabled={isStartingTranscription}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Transcription
          </Button>
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
              <Button 
                variant={isLessonVisible ? "secondary" : "default"}
                size="sm"
                className={`${isLessonVisible ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                onClick={handleViewLesson}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {isLessonVisible ? "Hide Lesson" : "View Lesson"}
              </Button>
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
