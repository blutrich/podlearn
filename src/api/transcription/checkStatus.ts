import { supabase } from "@/integrations/supabase/client";
import { TranscriptionStatus } from "@/types/transcription";

export const checkTranscriptionStatus = async (episodeId: string): Promise<TranscriptionStatus> => {
  console.log('Checking transcription status for episode:', episodeId);
  
  try {
    const { data: episode, error } = await supabase
      .from('episodes')
      .select('id, transcription_status, transcription_error, transcription_started_at, transcription_timeout_at, assemblyai_transcript_id')
      .eq('original_id', episodeId)
      .maybeSingle();

    if (error) {
      console.error('Error checking transcription status:', error);
      // Return pending status instead of failed for better UX
      return {
        transcription_status: 'pending',
        transcription_error: null,
        transcription_started_at: null
      };
    }

    if (!episode) {
      console.log('No episode found, returning pending status');
      return {
        transcription_status: 'pending',
        transcription_error: null,
        transcription_started_at: null
      };
    }

    // Check if we need to verify the status with AssemblyAI
    if (episode.transcription_status === 'processing' && episode.assemblyai_transcript_id) {
      try {
        const { data: assemblyStatus, error: assemblyError } = await supabase.functions.invoke(
          'check-assembly-status',
          {
            body: { transcript_id: episode.assemblyai_transcript_id }
          }
        );

        if (assemblyError) {
          throw assemblyError;
        }

        if (assemblyStatus?.status === 'completed') {
          await supabase
            .from('episodes')
            .update({
              transcription_status: 'completed'
            })
            .eq('id', episode.id);

          return {
            transcription_status: 'completed',
            transcription_error: null,
            transcription_started_at: episode.transcription_started_at
          };
        } else if (assemblyStatus?.status === 'error') {
          await supabase
            .from('episodes')
            .update({
              transcription_status: 'failed',
              transcription_error: assemblyStatus.error || 'AssemblyAI processing failed'
            })
            .eq('id', episode.id);

          return {
            transcription_status: 'failed',
            transcription_error: assemblyStatus.error || 'AssemblyAI processing failed',
            transcription_started_at: episode.transcription_started_at
          };
        }
      } catch (error) {
        console.error('Error checking AssemblyAI status:', error);
      }
    }

    // Check for timeout
    if (episode.transcription_status === 'processing' && 
        episode.transcription_timeout_at && 
        new Date() > new Date(episode.transcription_timeout_at)) {
      
      const { error: updateError } = await supabase
        .from('episodes')
        .update({
          transcription_status: 'failed',
          transcription_error: 'Transcription timed out after 20 minutes'
        })
        .eq('id', episode.id);

      if (updateError) {
        console.error('Error updating timeout status:', updateError);
      }

      return {
        transcription_status: 'failed',
        transcription_error: 'Transcription timed out after 20 minutes',
        transcription_started_at: episode.transcription_started_at
      };
    }

    console.log('Current transcription status:', episode.transcription_status);
    
    const status = episode.transcription_status as TranscriptionStatus['transcription_status'];
    return {
      transcription_status: status || 'pending',
      transcription_error: episode.transcription_error,
      transcription_started_at: episode.transcription_started_at
    };
  } catch (error) {
    console.error('Error in checkTranscriptionStatus:', error);
    return {
      transcription_status: 'failed',
      transcription_error: 'An unexpected error occurred',
      transcription_started_at: null
    };
  }
};
