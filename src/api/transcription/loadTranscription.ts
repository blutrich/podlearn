import { supabase } from "@/integrations/supabase/client";
import { TranscriptionSegment } from "@/types/transcription";

export const loadTranscriptionSegments = async (episodeId: string) => {
  console.log('Loading transcription segments for episode:', episodeId);
  
  try {
    // First check if we have the episode record
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('id, transcription_status')
      .eq('original_id', episodeId)
      .maybeSingle();

    if (episodeError) {
      console.error('Error fetching episode:', episodeError);
      return [];
    }

    if (!episode) {
      console.log('Episode not found:', episodeId);
      return [];
    }

    if (episode.transcription_status !== 'completed') {
      console.log('Transcription not completed yet:', episode.transcription_status);
      return [];
    }

    // Then get the transcription segments
    const { data: segments, error } = await supabase
      .from('transcriptions')
      .select('content, speaker, start_time, end_time, sentiment, sentiment_confidence, entities')
      .eq('episode_id', episode.id)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching transcription segments:', error);
      return [];
    }

    if (!segments || segments.length === 0) {
      console.log('No segments found for episode:', episodeId);
      
      // Double check the episode status
      const { error: updateError } = await supabase
        .from('episodes')
        .update({
          transcription_status: 'failed',
          transcription_error: 'No segments found for completed transcription'
        })
        .eq('id', episode.id);

      if (updateError) {
        console.error('Error updating episode status:', updateError);
      }
      
      return [];
    }

    // Log details about the segments to help with debugging
    console.log(`Found ${segments.length} segments for episode ${episodeId}`);
    if (segments.length === 1) {
      const segment = segments[0];
      console.log(`Single segment details - Length: ${segment.content.length} chars, Time: ${segment.start_time}-${segment.end_time}`);
    }

    // Convert the segments to the correct type
    const typedSegments: TranscriptionSegment[] = segments.map(segment => ({
      content: segment.content || '',
      speaker: segment.speaker || 'Speaker A', // Default to 'Speaker A' if null
      start_time: segment.start_time || 0,
      end_time: segment.end_time || 0,
      sentiment: segment.sentiment || undefined,
      sentiment_confidence: segment.sentiment_confidence || undefined,
      entities: Array.isArray(segment.entities) 
        ? segment.entities.map((entity: any) => ({
            entity_type: entity.entity_type,
            text: entity.text,
            start: entity.start,
            end: entity.end
          }))
        : undefined
    }));

    console.log(`Loaded ${typedSegments.length} segments`);
    return typedSegments;
  } catch (error) {
    console.error('Error in loadTranscriptionSegments:', error);
    return [];
  }
};
