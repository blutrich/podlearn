import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UseTranscriptionGenerateProps {
  episodeId: string;
  user: User | null;
  transcription: string;
}

export const useTranscriptionGenerate = ({
  episodeId,
  user,
  transcription
}: UseTranscriptionGenerateProps) => {
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);

  const handleGenerateLesson = async () => {
    if (!user || !transcription) return;

    try {
      setIsGeneratingLesson(true);
      console.log('Generating lesson for episode:', episodeId);

      // First get the episode's UUID
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .select('id')
        .eq('original_id', episodeId)
        .single();

      if (episodeError) {
        console.error('Error fetching episode:', episodeError);
        return;
      }

      if (!episode) {
        console.error('Episode not found');
        return;
      }

      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodeId: episode.id,
          transcription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating lesson:', error);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  return {
    isGeneratingLesson,
    handleGenerateLesson,
  };
};
