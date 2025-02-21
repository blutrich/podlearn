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
    const { episodeId } = await req.json()
    
    if (!episodeId) {
      throw new Error('Episode ID is required')
    }

    console.log('Generating lesson for episode:', episodeId)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First get episode details to ensure it exists
    const { data: episode, error: episodeError } = await supabaseClient
      .from('episodes')
      .select('id, original_id')
      .eq('original_id', episodeId)
      .maybeSingle()

    if (episodeError) {
      console.error('Error fetching episode:', episodeError)
      throw new Error('Failed to fetch episode')
    }

    if (!episode) {
      throw new Error('Episode not found')
    }

    // Update episode status
    await supabaseClient
      .from('episodes')
      .update({ lesson_generation_status: 'processing' })
      .eq('id', episode.id)

    // Get transcription segments
    const { data: segments, error: transcriptionError } = await supabaseClient
      .from('transcriptions')
      .select('content, speaker')
      .eq('episode_id', episode.id)
      .order('start_time', { ascending: true })

    if (transcriptionError) {
      console.error('Error fetching transcriptions:', transcriptionError)
      throw transcriptionError
    }

    if (!segments || segments.length === 0) {
      throw new Error('No transcription found for this episode')
    }

    // Combine all segments into one text
    const transcriptText = segments
      .map(seg => `${seg.speaker}: ${seg.content}`)
      .join('\n\n')

    // Limit transcript length to prevent memory issues
    const maxLength = 12000; // About 3000 tokens
    const truncatedTranscript = transcriptText.length > maxLength 
      ? transcriptText.slice(0, maxLength) + "\n[Transcript truncated for length...]"
      : transcriptText;

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

    // Get episode details for the title
    const { data: episodeDetails } = await supabaseClient
      .from('episodes')
      .select('title')
      .eq('id', episode.id)
      .single()

    // Store the generated lesson
    const { error: insertError } = await supabaseClient
      .from('generated_lessons')
      .insert({
        episode_id: episode.id,
        title: `Lesson for: ${episodeDetails?.title || 'Untitled Episode'}`,
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
