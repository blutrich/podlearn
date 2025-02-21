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

      // First get the episode's UUID and transcription segments
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('original_id', episodeId)
        .single();

      console.log('Episode query result:', { episode, error: episodeError });

      if (episodeError) {
        console.error('Error fetching episode:', episodeError);
        return;
      }

      if (!episode) {
        console.error('Episode not found in database');
        return;
      }

      // Get all transcription segments
      const { data: segments, error: transcriptionError } = await supabase
        .from('transcriptions')
        .select('content, speaker')
        .eq('episode_id', episode.id)
        .order('start_time', { ascending: true });

      console.log('Transcription segments:', { count: segments?.length, error: transcriptionError });

      if (transcriptionError) {
        console.error('Error fetching transcriptions:', transcriptionError);
        return;
      }

      if (!segments || segments.length === 0) {
        console.error('No transcription segments found');
        return;
      }

      // Format transcription
      const formattedTranscription = segments
        .map(seg => `${seg.speaker}: ${seg.content}`)
        .join('\n\n');

      // Call the Supabase Edge Function
      const isDevelopment = import.meta.env.MODE === 'development';
      const baseUrl = isDevelopment 
        ? 'http://127.0.0.1:54321/functions/v1'
        : 'https://httiyebjgxxwtgggkpgw.supabase.co/functions/v1';

      console.log('Sending request to Edge Function:', {
        url: `${baseUrl}/generate-lesson-from-transcript`,
        episodeId: episode.id,
        title: episode.title,
        transcriptionLength: formattedTranscription.length
      });

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${baseUrl}/generate-lesson-from-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          episodeId: episode.id,
          title: episode.title,
          transcription: formattedTranscription
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Edge Function error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        const errorMessage = errorData.error || `Failed to generate lesson: ${response.status} ${response.statusText}`;
        console.error('Error details:', errorMessage);
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Failed to parse response:', error);
        throw new Error('Failed to parse lesson response');
      }

      if (!data.success) {
        const errorMessage = data.message || data.error || 'Failed to generate lesson';
        console.error('Generation failed:', errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('Error generating lesson:', error);
      throw error; // Re-throw to handle in the parent component
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  return {
    isGeneratingLesson,
    handleGenerateLesson,
  };
};
