
import { useState, useCallback } from "react";
import { loadTranscriptionSegments } from "@/api/transcription";
import { formatTranscription } from "@/utils/transcriptionFormatter";

export const useTranscriptionLoad = () => {
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [transcription, setTranscription] = useState<string>("");

  const loadTranscription = useCallback(async (episodeId: string) => {
    try {
      setIsLoadingTranscription(true);
      const segments = await loadTranscriptionSegments(episodeId);
      
      if (segments.length === 0) {
        return false;
      }

      setTranscription(formatTranscription(segments));
      return true;
    } catch (error) {
      console.error('Error loading transcription:', error);
      return false;
    } finally {
      setIsLoadingTranscription(false);
    }
  }, []);

  return {
    isLoadingTranscription,
    transcription,
    loadTranscription,
    setTranscription
  };
};
