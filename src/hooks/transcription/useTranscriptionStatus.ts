
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { checkTranscriptionStatus } from "@/api/transcription";

export const useTranscriptionStatus = (episodeId: string) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);

  const checkStatus = useCallback(async (
    isMounted: boolean,
    lastStatus: string,
    transcriptionComplete: boolean,
    onStatusChange: (status: string, isComplete: boolean) => void,
    startTime: number,
    onError: (error: Error) => void
  ) => {
    try {
      const status = await checkTranscriptionStatus(episodeId);
      
      if (!isMounted) return;

      // Update progress based on status
      if (status.transcription_status !== lastStatus) {
        switch (status.transcription_status) {
          case 'processing':
            setProgress(prev => Math.min(prev + 10, 65));
            break;
          case 'completed':
            setProgress(70);
            break;
          case 'failed':
            throw new Error(status.transcription_error || 'Transcription failed');
        }
      }

      if (status.transcription_status === 'completed' && !transcriptionComplete) {
        onStatusChange(status.transcription_status, true);
      } else if (status.transcription_status === 'failed') {
        throw new Error(status.transcription_error || 'Transcription failed. Please try again.');
      } else {
        // Check for timeout
        const TIMEOUT = 20 * 60 * 1000; // 20 minutes timeout
        if (Date.now() - startTime > TIMEOUT) {
          throw new Error('Transcription timed out. Please try again later.');
        }
        // Increment progress smoothly while processing
        if (isMounted) {
          setProgress(prev => Math.min(prev + 1, 65));
        }
        onStatusChange(status.transcription_status, false);
      }
    } catch (error) {
      if (isMounted) {
        console.error('Error in status check:', error);
        onError(error instanceof Error ? error : new Error('Failed to check transcription status'));
      }
    }
  }, [episodeId]);

  return {
    progress,
    setProgress,
    checkStatus
  };
};
