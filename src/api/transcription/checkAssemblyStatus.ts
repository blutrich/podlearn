import { supabase } from "@/integrations/supabase/client";

export const checkAssemblyStatus = async (transcriptId: string) => {
  console.log(`Directly checking AssemblyAI status for transcript ID: ${transcriptId}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('check-assembly-status', {
      body: { transcript_id: transcriptId }
    });
    
    if (error) {
      console.error('Error checking AssemblyAI status:', error);
      throw error;
    }
    
    console.log('AssemblyAI status response:', data);
    return data;
  } catch (error) {
    console.error('Exception checking AssemblyAI status:', error);
    throw error;
  }
};

export const getAssemblyIdForEpisode = async (episodeId: string) => {
  try {
    const { data, error } = await supabase
      .from('episodes')
      .select('assemblyai_transcript_id')
      .eq('original_id', episodeId)
      .maybeSingle();
      
    if (error) {
      console.error('Error getting AssemblyAI ID for episode:', error);
      throw error;
    }
    
    if (!data || !data.assemblyai_transcript_id) {
      throw new Error(`No AssemblyAI transcript ID found for episode ${episodeId}`);
    }
    
    return data.assemblyai_transcript_id;
  } catch (error) {
    console.error('Exception getting AssemblyAI ID for episode:', error);
    throw error;
  }
};

export const checkTranscriptionStatusDirectly = async (episodeId: string) => {
  try {
    // First get the transcript ID
    const transcriptId = await getAssemblyIdForEpisode(episodeId);
    
    // Then check the status
    const status = await checkAssemblyStatus(transcriptId);
    
    // If transcription is complete but our database doesn't reflect that,
    // update it manually
    if (status.status === 'completed') {
      const { error } = await supabase
        .from('episodes')
        .update({
          transcription_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('original_id', episodeId);
        
      if (error) {
        console.error('Error updating episode status:', error);
      }
    }
    
    return status;
  } catch (error) {
    console.error('Error checking transcription status directly:', error);
    throw error;
  }
}; 