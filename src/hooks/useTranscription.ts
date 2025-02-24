import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTranscriptionStatus } from "./transcription/useTranscriptionStatus";
import { useTranscriptionCopy } from "./transcription/useTranscriptionCopy";
import { useTranscriptionLoad } from "./transcription/useTranscriptionLoad";
import { useTranscriptionStart } from "./transcription/useTranscriptionStart";
import { useTranscriptionGenerate } from "./transcription/useTranscriptionGenerate";
import { useTranscriptionView } from "./transcription/useTranscriptionView";
import { useEpisodeAccess } from "./useEpisodeAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTranscription = (episodeId: string) => {
  const { user } = useAuth();
  const [lesson, setLesson] = useState<{ title: string; content: string; } | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const { checkEpisodeAccess, remainingTrialEpisodes, hasActiveSubscription, credits } = useEpisodeAccess();
  
  const { progress, setProgress, checkStatus } = useTranscriptionStatus(episodeId);
  const { handleCopyTranscription } = useTranscriptionCopy();
  const { 
    isLoadingTranscription, 
    transcription, 
    loadTranscription 
  } = useTranscriptionLoad();

  const loadLesson = async () => {
    try {
      setIsLoadingLesson(true);
      
      // First get the episode's UUID
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .select('id')
        .eq('original_id', episodeId)
        .single();

      if (episodeError) {
        console.error('Error fetching episode:', episodeError);
        return null;
      }

      if (!episode) {
        console.error('Episode not found');
        return null;
      }

      // Now get the lesson using the episode's UUID
      const { data, error } = await supabase
        .from('generated_lessons')
        .select('title, content')
        .eq('episode_id', episode.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error loading lesson:', error);
        }
        return null;
      }

      if (data) {
        setLesson(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error loading lesson:', error);
      return null;
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const { isStartingTranscription, handleStartTranscription: originalStartTranscription } = useTranscriptionStart({
    episodeId,
    user,
    setProgress,
    checkStatus,
    loadTranscription
  });

  const handleStartTranscription = async () => {
    // Check access before starting transcription
    const hasAccess = await checkEpisodeAccess(episodeId);
    if (!hasAccess) {
      if (remainingTrialEpisodes > 0) {
        toast.error(`You have ${remainingTrialEpisodes} free trial episodes remaining`);
      } else if (!hasActiveSubscription && credits === 0) {
        toast.error('Please purchase credits or subscribe to process more episodes');
      } else {
        toast.error('Unable to process this episode');
      }
      return;
    }
    
    await originalStartTranscription();
  };

  const { isGeneratingLesson, handleGenerateLesson: handleGenerate } = useTranscriptionGenerate({
    episodeId,
    user,
    transcription
  });

  const handleGenerateLesson = async () => {
    await handleGenerate();
    await loadLesson();
  };

  const { handleViewTranscription } = useTranscriptionView({
    episodeId,
    user,
    loadTranscription
  });

  // Initial load of lesson
  useEffect(() => {
    loadLesson();
  }, [episodeId]);

  // Status check effect
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
              // Only load lesson if we don't already have one
              if (!lesson) {
                await loadLesson();
              }
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
  }, [episodeId, loadTranscription, checkStatus, lesson]);

  return {
    isGeneratingLesson,
    isStartingTranscription,
    transcription,
    isLoadingTranscription,
    isLoadingLesson,
    progress,
    lesson,
    remainingTrialEpisodes,
    hasActiveSubscription,
    credits,
    handleStartTranscription,
    handleGenerateLesson,
    handleViewTranscription,
    handleCopyTranscription: () => handleCopyTranscription(transcription),
  };
};
