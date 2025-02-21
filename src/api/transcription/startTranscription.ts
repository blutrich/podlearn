
import { supabase } from "@/integrations/supabase/client";

export const startTranscription = async (episodeId: string) => {
  console.log('Starting transcription for episode:', episodeId);
  
  try {
    // First check if episode exists and get its data
    const { data: episodeData, error: searchError } = await supabase.functions.invoke('search-podcasts', {
      body: { 
        action: 'get_episode',
        episodeId: episodeId
      }
    });

    if (searchError) {
      console.error('Error getting episode data:', searchError);
      return { data: null, error: 'Failed to get episode data' };
    }

    if (!episodeData?.episode) {
      console.error('Episode not found:', episodeId);
      return { data: null, error: 'Episode not found' };
    }

    console.log('Episode data retrieved:', {
      title: episodeData.episode.title,
      audioUrl: episodeData.episode.audio_url,
      podcastId: episodeData.episode.podcast_id,
      episodeId: episodeId
    });

    // Start the transcription process
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: { 
        episodeId: episodeId,
        audioUrl: episodeData.episode.audio_url,
        title: episodeData.episode.title,
        podcastId: episodeData.episode.podcast_id
      }
    });

    if (error) {
      console.error('Error starting transcription:', error);
      return { data: null, error: 'Failed to start transcription' };
    }

    console.log('Transcription process started successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error in startTranscription:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
};
