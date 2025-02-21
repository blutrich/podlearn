
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

    const lessonPrompt = `You will be creating an educational lesson based on this podcast transcript:

${transcriptText}

Create an educational lesson following this exact format:

1. Title:
   - Create a concise, engaging title that summarizes the main topic (max 10 words).

2. Summary:
   - Write 2-3 sentences providing an overview of the main themes.

3. Top 3 Takeaways:
   - List the three most important points as clear, single sentences.

4. Core Concepts Explained:
   For each of 3 key concepts:
   - Name of concept
   - 1-2 sentence explanation
   - Relevant quote from transcript
   - 2-3 bullet points on practical application

5. Practical Examples:
   For each of 2 examples:
   - One-sentence context
   - Quote from transcript
   - One-sentence lesson/insight

6. Action Steps:
   - Three clear, actionable instructions based on the content.`

    console.log('Generating lesson with OpenAI')

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an educational content creator skilled at creating structured, informative lesson summaries from podcast transcripts."
          },
          {
            role: "user",
            content: lessonPrompt
          }
        ],
        temperature: 0.7
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
