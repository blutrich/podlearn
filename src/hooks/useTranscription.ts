
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTranscriptionStatus } from "./transcription/useTranscriptionStatus";
import { useTranscriptionCopy } from "./transcription/useTranscriptionCopy";
import { useTranscriptionLoad } from "./transcription/useTranscriptionLoad";
import { useTranscriptionStart } from "./transcription/useTranscriptionStart";
import { useTranscriptionGenerate } from "./transcription/useTranscriptionGenerate";
import { useTranscriptionView } from "./transcription/useTranscriptionView";

export const useTranscription = (episodeId: string) => {
  const { user } = useAuth();
  
  const { progress, setProgress, checkStatus } = useTranscriptionStatus(episodeId);
  const { handleCopyTranscription } = useTranscriptionCopy();
  const { 
    isLoadingTranscription, 
    transcription, 
    loadTranscription 
  } = useTranscriptionLoad();

  const { isStartingTranscription, handleStartTranscription } = useTranscriptionStart({
    episodeId,
    user,
    setProgress,
    checkStatus,
    loadTranscription
  });

  const { isGeneratingLesson, handleGenerateLesson } = useTranscriptionGenerate({
    episodeId,
    user,
    transcription
  });

  const { handleViewTranscription } = useTranscriptionView({
    episodeId,
    user,
    loadTranscription
  });

  useEffect(() => {
    let isMounted = true;

    const checkInitialStatus = async () => {
      try {
        await checkStatus(
          isMounted,
          '',
          false,
          async (status, isComplete) => {
            if (isComplete && isMounted) {
              await loadTranscription(episodeId);
            }
          },
          Date.now(),
          (error) => console.error('Error checking initial status:', error)
        );
      } catch (error) {
        console.error('Error checking initial status:', error);
      }
    };
    
    checkInitialStatus();

    return () => {
      isMounted = false;
    };
  }, [episodeId, loadTranscription, checkStatus]);

  return {
    isGeneratingLesson,
    isStartingTranscription,
    transcription,
    isLoadingTranscription,
    progress,
    handleStartTranscription,
    handleGenerateLesson,
    handleViewTranscription,
    handleCopyTranscription: () => handleCopyTranscription(transcription),
  };
};
