
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { generateLesson } from "@/api/transcription";
import { User } from "@supabase/supabase-js";

interface UseTranscriptionGenerateProps {
  episodeId: string;
  user: User | null;
  transcription: string | null;
}

export const useTranscriptionGenerate = ({
  episodeId,
  user,
  transcription
}: UseTranscriptionGenerateProps) => {
  const { toast } = useToast();
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);

  const handleGenerateLesson = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate lessons.",
        variant: "destructive",
      });
      return;
    }

    if (!transcription) {
      toast({
        title: "No Transcription Available",
        description: "Please complete the transcription process first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingLesson(true);
      const result = await generateLesson(episodeId);
      
      if (result.error || !result.data) {
        throw new Error(result.error || "Failed to generate lesson");
      }

      toast({
        title: "Lesson Generated",
        description: "Your lesson has been created successfully!",
      });
    } catch (error) {
      console.error('Error generating lesson:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate lesson. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLesson(false);
    }
  }, [episodeId, toast, user, transcription]);

  return {
    isGeneratingLesson,
    handleGenerateLesson
  };
};
