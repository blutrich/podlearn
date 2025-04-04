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
      // Log the start of transcription with context
      console.log(`Starting transcription for episode ${episodeId}`, {
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      
      setIsStartingTranscription(true);
      setProgress(10);
      
      const result = await startTranscription(episodeId);
      
      if (result.error || !result.data) {
        console.error('Transcription start failed:', {
          error: result.error,
          episodeId,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
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
      
      // Set up polling with exponential backoff
      let pollDelay = 2000; // Start with 2 seconds
      const maxPollDelay = 30000; // Max 30 seconds
      
      const pollStatus = async () => {
        try {
          await checkStatus(
            isMounted,
            lastStatus,
            transcriptionComplete,
            (status, isComplete) => {
              if (!isMounted) return;
              
              lastStatus = status;
              if (isComplete && !transcriptionComplete) {
                transcriptionComplete = true;
                
                // Log successful completion
                console.log(`Transcription completed for episode ${episodeId}`, {
                  userId: user.id,
                  duration: Math.round((Date.now() - startTime) / 1000),
                  timestamp: new Date().toISOString()
                });
                
                if (pollInterval) {
                  clearInterval(pollInterval);
                  pollInterval = null;
                }
                
                loadTranscription(episodeId);
                setProgress(100);
                setIsStartingTranscription(false);
                
                toast({
                  title: "Transcription Complete",
                  description: "You can now generate a lesson from this transcription.",
                });
              }
            },
            startTime,
            (error) => {
              if (!isMounted) return;
              
              console.error('Error polling transcription status:', {
                error: error.message,
                episodeId,
                userId: user.id,
                timestamp: new Date().toISOString()
              });
              
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
              
              setIsStartingTranscription(false);
              setProgress(0);
              
              toast({
                title: "Transcription Error",
                description: error.message || "An error occurred during transcription.",
                variant: "destructive",
              });
            }
          );
          
          // Implement exponential backoff for polling
          if (!transcriptionComplete) {
            pollDelay = Math.min(pollDelay * 1.5, maxPollDelay);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      };
      
      // Initial poll
      await pollStatus();
      
      // Set up interval with exponential backoff
      pollInterval = setInterval(pollStatus, pollDelay);
      
      return () => {
        isMounted = false;
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      };
    } catch (error) {
      if (!isMounted) return;
      
      console.error('Transcription start error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        episodeId,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      
      setIsStartingTranscription(false);
      setProgress(0);
      
      toast({
        title: "Transcription Error",
        description: error instanceof Error ? error.message : "Failed to start transcription",
        variant: "destructive",
      });
    }
  }, [episodeId, user, setProgress, checkStatus, loadTranscription, toast]);

  return { isStartingTranscription, handleStartTranscription };
};
