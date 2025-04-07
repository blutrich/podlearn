/// <reference lib="deno.ns" />
/// <reference lib="deno.window" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { episodeId, title, transcription } = await req.json()
    
    if (!episodeId) {
      throw new Error('Episode ID is required')
    }

    console.log('Received request:', { episodeId, hasTitle: Boolean(title), transcriptionLength: transcription?.length });

    // Log environment variables (redacted)
    const supabaseUrl = Deno.env.get('DB_URL');
    const serviceRoleKey = Deno.env.get('DB_SERVICE_ROLE_KEY');
    console.log('Environment check:', { 
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      url: supabaseUrl // Log the URL to verify it's correct
    });

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing database credentials. Please check environment variables: DB_URL and DB_SERVICE_ROLE_KEY');
    }

    try {
      console.log('Looking up episode with ID:', episodeId);
      
      // Fetch episode using direct REST API call
      const episodeResponse = await fetch(`${supabaseUrl}/rest/v1/episodes?id=eq.${episodeId}&select=id,title`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });

      if (!episodeResponse.ok) {
        throw new Error(`Failed to fetch episode: ${episodeResponse.statusText}`);
      }

      const episodes = await episodeResponse.json();
      const episode = episodes[0];

      console.log('Episode lookup result:', { 
        hasEpisode: Boolean(episode), 
        episodeData: episode,
        queriedId: episodeId,
        supabaseUrl: supabaseUrl
      });

      if (!episode) {
        throw new Error(`Episode not found with ID: ${episodeId}`);
      }

      // Use the provided transcription instead of fetching segments
      if (!transcription) {
        throw new Error('Transcription is required')
      }

      // Update episode status
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/episodes?id=eq.${episode.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ lesson_generation_status: 'processing' })
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update episode status: ${updateResponse.statusText}`);
      }

      // Limit transcript length to prevent memory issues
      const maxLength = 80000; // Increased from 24000 to capture more content with GPT-4o's larger context window
      const truncatedTranscript = transcription.length > maxLength 
        ? transcription.slice(0, maxLength) + "\n[Transcript truncated for length...]"
        : transcription;

      const lessonPrompt = `You are tasked with creating a comprehensive educational lesson from a podcast transcript. Your primary goal is to ensure NO important ideas or concepts are lost from the original content. Follow these detailed instructions:

First, carefully analyze this podcast transcript:

<podcast_transcript>
${truncatedTranscript}
</podcast_transcript>

Create an educational lesson that captures ALL key ideas using this structure:

1. Title:
   - Create a descriptive title that encompasses the main topic and subtopics
   - Maximum 15 words to allow for more detail

2. Summary (Expanded):
   - Write 3-4 sentences that provide a comprehensive overview
   - Must touch on ALL major themes discussed
   - Include any context or background information provided

3. Key Ideas (Comprehensive List):
   - List ALL important ideas mentioned in the podcast
   - Each idea should be 1-2 sentences
   - Include both major points and supporting concepts
   - Number each idea for easy reference

4. Core Concepts Deep Dive:
   - Number each concept (1., 2., etc.)
   - For each concept:
     a) Start with the concept name on its own line
     b) Provide a clear explanation in 2-3 sentences
     c) Include relevant quotes from the transcript (in quotation marks)
     d) List applications with bullet points (•)
     e) If applicable, list related concepts with bullet points (•)
     f) If applicable, list common misconceptions with bullet points (•)

   Example format:
   1. Concept Name
      [Explanation in 2-3 sentences]
      
      "First relevant quote from transcript"
      "Second relevant quote if available"
      
      Applications:
      • First application point
      • Second application point
      
      Related Concepts:
      • Related concept 1
      • Related concept 2
      
      Misconceptions:
      • First misconception
      • Second misconception

5. Supporting Evidence:
   - Include 3-4 specific examples from the transcript
   - For each example:
     a) Full context explanation
     b) Direct quote
     c) Why this example is significant
     d) How it connects to the larger concepts

6. Expert Insights:
   - List any specific expertise or authority referenced
   - Include credentials or experience mentioned
   - Capture specific recommendations or warnings
   - Note any disagreements or alternative viewpoints presented

7. Action Steps and Implementation:
   - Create 5-7 actionable steps
   - Include both immediate and long-term actions
   - Add any prerequisites or dependencies
   - Note any specific tools or resources mentioned

8. Additional Resources:
   - List any books, articles, or resources mentioned
   - Include any recommended tools or platforms
   - Note any specific methodologies or frameworks referenced

Important Guidelines:
- Use exact quotes whenever possible
- Maintain the speaker's original terminology
- Include numerical data or statistics mentioned
- Preserve any chronological or sequential information
- Note any cause-and-effect relationships
- Capture any debates or contrasting viewpoints
- Include real-world examples and case studies
- Preserve context and nuance

Output your completed lesson within <educational_lesson> tags.`;

      console.log('Generating comprehensive lesson with OpenAI')

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o", // Using GPT-4o with 128k context window
          messages: [
            {
              role: "system",
              content: "You are an expert educational content creator skilled at creating comprehensive, structured lesson summaries. Your goal is to ensure no important information is lost from the source material. Follow the format exactly as specified in the prompt."
            },
            {
              role: "user",
              content: lessonPrompt
            }
          ],
          temperature: 0.2, // Reduced for more consistent and precise output
          max_tokens: 8000 // Increased token limit for more comprehensive coverage
        })
      })

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text()
        console.error('OpenAI API error:', error)
        throw new Error(`Failed to generate lesson: ${error}`)
      }

      const completion = await openaiResponse.json()
      const lessonContent = completion.choices[0].message.content

      // Delete existing lesson
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/generated_lessons?episode_id=eq.${episode.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete existing lesson: ${deleteResponse.statusText}`);
      }

      // Store the generated lesson
      const storeResponse = await fetch(`${supabaseUrl}/rest/v1/generated_lessons`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          episode_id: episode.id,
          title: title || `Lesson for: ${episode.title || 'Untitled Episode'}`,
          content: lessonContent
        })
      });

      if (!storeResponse.ok) {
        throw new Error(`Failed to store generated lesson: ${storeResponse.statusText}`);
      }

      // Update episode status
      const updateStatusResponse = await fetch(`${supabaseUrl}/rest/v1/episodes?id=eq.${episode.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ lesson_generation_status: 'completed' })
      });

      if (!updateStatusResponse.ok) {
        throw new Error(`Failed to update episode status: ${updateStatusResponse.statusText}`);
      }

      console.log('Lesson generated and stored successfully')

      return new Response(
        JSON.stringify({ success: true, message: 'Lesson generated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      throw new Error(`Database operation failed: ${dbError.message}`);
    }

  } catch (error) {
    console.error('Error in generate-lesson-from-transcript function:', error)
    
    if (error.message.includes('No transcription found')) {
      return new Response(
        JSON.stringify({ 
          error: 'No transcription available. Please wait for transcription to complete before generating a lesson.' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
