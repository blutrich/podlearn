
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { startTranscription } from "@/api/transcription";
import { User } from "@supabase/supabase-js";

interface UseTranscriptionStartProps {
  episodeId: string;
  user: User | null;
  setProgress: (value: number) => void;
  checkStatus: (
    isMounted: boolean,
    lastStatus: string,
    transcriptionComplete: boolean,
    onStatusChange: (status: string, isComplete: boolean) => void,
    startTime: number,
    onError: (error: Error) => void
  ) => Promise<void>;
  loadTranscription: (episodeId: string) => Promise<boolean>;
}

export const useTranscriptionStart = ({
  episodeId,
  user,
  setProgress,
  checkStatus,
  loadTranscription
}: UseTranscriptionStartProps) => {
  const { toast } = useToast();
  const [isStartingTranscription, setIsStartingTranscription] = useState(false);

  const handleStartTranscription = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start transcription.",
        variant: "destructive",
      });
      return;
    }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      setIsStartingTranscription(true);
      setProgress(10);
      
      const result = await startTranscription(episodeId);
      
      if (result.error || !result.data) {
        throw new Error(result.error || "Failed to start transcription");
      }

      setProgress(30);
      toast({
        title: "Transcription Started",
        description: "This may take a few minutes. You can generate a lesson once the transcription is complete.",
      });

      let transcriptionComplete = false;
      let lastStatus = '';
      let startTime = Date.now();

      // Start polling for transcription status
      pollInterval = setInterval(async () => {
        if (!isMounted) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        await checkStatus(
          isMounted,
          lastStatus,
          transcriptionComplete,
          async (status, isComplete) => {
            lastStatus = status;
            if (isComplete) {
              transcriptionComplete = true;
              
              const hasTranscription = await loadTranscription(episodeId);
              if (hasTranscription) {
                toast({
                  title: "Transcription Complete",
                  description: "You can now generate a lesson or view the transcription.",
                });
                setIsStartingTranscription(false);
                setProgress(100);
              }
              
              if (pollInterval) clearInterval(pollInterval);
            }
          },
          startTime,
          (error) => {
            if (pollInterval) clearInterval(pollInterval);
            setProgress(0);
            setIsStartingTranscription(false);
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        );
      }, 5000);

      return () => {
        isMounted = false;
        if (pollInterval) clearInterval(pollInterval);
      };
    } catch (error) {
      console.error('Error in transcription process:', error);
      if (isMounted) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to start transcription. Please try again later.",
          variant: "destructive",
        });
        setIsStartingTranscription(false);
        setProgress(0);
      }
    }
  }, [episodeId, loadTranscription, toast, user, setProgress, checkStatus]);

  return {
    isStartingTranscription,
    handleStartTranscription
  };
};
