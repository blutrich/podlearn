
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TranscriptionControlsProps {
  isLoadingTranscription: boolean;
  isStartingTranscription: boolean;
  isGeneratingLesson: boolean;
  transcription: string;
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
  transcription,
  progress,
  onStartTranscription,
  onViewTranscription,
  onCopyTranscription,
  onGenerateLesson,
}: TranscriptionControlsProps) => {
  const [isTranscriptionVisible, setIsTranscriptionVisible] = useState(false);
  const hasTranscription = Boolean(transcription);

  const handleViewTranscription = () => {
    setIsTranscriptionVisible(!isTranscriptionVisible);
    onViewTranscription();
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
              variant="secondary" 
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
            <Button 
              variant="secondary" 
              size="sm"
              onClick={onGenerateLesson}
              disabled={isGeneratingLesson}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {isGeneratingLesson ? "Generating..." : "Generate Lesson"}
            </Button>
          </>
        )}
      </div>

      {isTranscriptionVisible && transcription && (
        <div className="mt-4 p-4 bg-muted rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm">{transcription}</pre>
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
