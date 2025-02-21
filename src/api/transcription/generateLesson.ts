
import { supabase } from "@/integrations/supabase/client";

export const generateLesson = async (episodeId: string) => {
  console.log('Generating lesson for episode:', episodeId);
  try {
    const response = await supabase.functions.invoke('generate-lesson-from-transcript', {
      body: { episodeId }
    });
    
    if (response.error) {
      console.error('Error generating lesson:', response.error);
    }
    return response;
  } catch (error) {
    console.error('Error generating lesson:', error);
    return { data: null, error: 'Failed to generate lesson' };
  }
};
