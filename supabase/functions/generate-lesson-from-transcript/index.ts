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
      const supabaseClient = createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          db: {
            schema: 'public'
          }
        }
      )

      // First get episode details to ensure it exists
      console.log('Looking up episode with ID:', episodeId);
      const { data: episode, error: episodeError } = await supabaseClient
        .from('episodes')
        .select('id, title')
        .eq('id', episodeId)
        .limit(1)
        .maybeSingle()

      console.log('Episode lookup result:', { 
        hasEpisode: Boolean(episode), 
        error: episodeError?.message || null,
        errorCode: episodeError?.code || null,
        details: episodeError?.details || null,
        episodeData: episode, // Log the actual episode data
        queriedId: episodeId,
        supabaseUrl: supabaseUrl // Log the URL being used
      });

      if (episodeError) {
        console.error('Error fetching episode:', {
          message: episodeError.message,
          code: episodeError.code,
          details: episodeError.details,
          queryId: episodeId
        });
        throw new Error(`Failed to fetch episode: ${episodeError.message}`);
      }

      if (!episode) {
        throw new Error(`Episode not found with ID: ${episodeId}`);
      }

      // Use the provided transcription instead of fetching segments
      if (!transcription) {
        throw new Error('Transcription is required')
      }

      // Update episode status
      await supabaseClient
        .from('episodes')
        .update({ lesson_generation_status: 'processing' })
        .eq('id', episode.id)

      // Limit transcript length to prevent memory issues
      const maxLength = 12000; // About 3000 tokens
      const truncatedTranscript = transcription.length > maxLength 
        ? transcription.slice(0, maxLength) + "\n[Transcript truncated for length...]"
        : transcription;

      const lessonPrompt = `You will be creating an educational lesson based on a podcast transcript. The lesson should follow a specific format and include certain elements. Here's how to proceed:

First, carefully read through the following podcast transcript:

<podcast_transcript>
${truncatedTranscript}
</podcast_transcript>

Now, create an educational lesson based on this transcript. Follow these steps:

1. Title:
   - Create a concise, engaging title that summarizes the main topic of the podcast.
   - Limit it to a single line with a maximum of 10 words.

2. Summary:
   - Write 2-3 sentences that provide an overview of what the lesson covers.
   - Focus on the main themes or ideas discussed in the podcast.

3. Top 3 Takeaways:
   - Identify the three most important points from the podcast.
   - Express each takeaway as a single, clear sentence.

4. Core Concepts Explained:
   - Choose three key concepts discussed in the podcast.
   - For each concept:
     a) Provide a name for the concept.
     b) Explain what it is in 1-2 sentences.
     c) Include an exact quote from the transcript that relates to this concept.
     d) List 2-3 bullet points on how to apply this concept.

5. Practical Examples:
   - Select two examples from the podcast that illustrate key points.
   - For each example:
     a) Provide a one-sentence context.
     b) Include an exact quote from the transcript.
     c) Explain the lesson or insight from this example in one sentence.

6. Action Steps:
   - Create three actionable steps that listeners can take based on the podcast content.
   - Express each step as a single, clear instruction.

Important Format Rules:
- Include all sections in the exact order shown in the task description.
- Use word-for-word quotes from the transcript where required.
- Keep all bullet points to single sentences.
- Use consistent bullet point symbols throughout.
- Maintain the exact spacing shown in the task description.
- Include all section headers exactly as written.

Output your completed lesson within <educational_lesson> tags.`

      console.log('Generating lesson with OpenAI')

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo-16k", // Using 16k context model instead of gpt-4
          messages: [
            {
              role: "system",
              content: "You are an educational content creator skilled at creating structured, informative lesson summaries from podcast transcripts. Follow the format exactly as specified in the prompt, including all headers and structural elements."
            },
            {
              role: "user",
              content: lessonPrompt
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent formatting
          max_tokens: 2500 // Increased slightly to accommodate the detailed format
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
      await supabaseClient
        .from('generated_lessons')
        .delete()
        .eq('episode_id', episode.id)

      // Store the generated lesson
      const { error: insertError } = await supabaseClient
        .from('generated_lessons')
        .insert({
          episode_id: episode.id,
          title: title || `Lesson for: ${episode.title || 'Untitled Episode'}`,
          content: lessonContent
        })

      if (insertError) {
        console.error('Error inserting lesson:', insertError)
        throw new Error('Failed to store generated lesson')
      }

      // Update episode status
      await supabaseClient
        .from('episodes')
        .update({ lesson_generation_status: 'completed' })
        .eq('id', episode.id)

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
