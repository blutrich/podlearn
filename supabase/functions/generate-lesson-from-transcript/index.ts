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

    // Extract user ID from Authorization header
    const authHeader = req.headers.get('Authorization')
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Decode JWT token to get user ID (basic decoding without verification since we're in a trusted environment)
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
        console.log('Extracted user ID from token:', userId);
      } catch (error) {
        console.error('Error extracting user ID from token:', error);
        // Continue without user ID for now, but log the issue
      }
    }

    console.log('Received request:', { episodeId, hasTitle: Boolean(title), transcriptionLength: transcription?.length, userId });

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
      const episodeResponse = await fetch(`${supabaseUrl}/rest/v1/episodes?id=eq.${episodeId}&select=id,title,is_hebrew`, {
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
        isHebrew: episode?.is_hebrew,
        supabaseUrl: supabaseUrl
      });

      if (!episode) {
        throw new Error(`Episode not found with ID: ${episodeId}`);
      }

      // Use the provided transcription instead of fetching segments
      if (!transcription) {
        throw new Error('Transcription is required')
      }

      // Check if this is a Hebrew episode and generate appropriate prompt
      const isHebrew = episode.is_hebrew;
      
      // Fallback Hebrew detection: check if transcription contains Hebrew characters
      const hebrewRegex = /[\u0590-\u05FF]/;
      const hasHebrewContent = hebrewRegex.test(transcription);
      const shouldGenerateHebrew = isHebrew || hasHebrewContent;
      
      console.log('Language detection:', { 
        episodeIsHebrew: isHebrew, 
        hasHebrewContent, 
        shouldGenerateHebrew,
        transcriptionSample: transcription.substring(0, 100)
      });

      // Update episode status
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/episodes?id=eq.${episode.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          lesson_generation_status: 'processing',
          is_hebrew: shouldGenerateHebrew // Update the Hebrew flag based on detection
        })
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update episode status: ${updateResponse.statusText}`);
      }

      // Limit transcript length to prevent memory issues
      const maxLength = 80000; // Increased from 24000 to capture more content with GPT-4o's larger context window
      const truncatedTranscript = transcription.length > maxLength 
        ? transcription.slice(0, maxLength) + "\n[Transcript truncated for length...]"
        : transcription;

      const lessonPrompt = shouldGenerateHebrew ? `אתה מתמחה ביצירת תוכן חינוכי מקצועי מתמלילי פודקאסטים. המטרה שלך היא לוודא שאף רעיון או מושג חשוב לא יאבד מהתוכן המקורי. בצע את ההוראות הבאות בקפידה:

תחילה, נתח בעיון את התמליל הבא:

<podcast_transcript>
${truncatedTranscript}
</podcast_transcript>

צור שיעור חינוכי מקיף הכולל את כל הרעיונות המרכזיים על פי המבנה הבא:

1. כותרת (בסגנון מושך):
   - צור כותרת מעניינת ומושכת שגורמת לאנשים לרצות ללמוד יותר
   - השתמש במילות כוח, מספרים, או שאלות מסקרנות כשמתאים
   - דוגמאות: "3 הסודות שמובילים ל...", "למה רוב האנשים נכשלים ב...", "האמת הנסתרת על...", "איך להפוך למומחה ב..."
   - שמור על פחות מ-12 מילים אבל עשה את זה בלתי ניתן לעמידה
   - התמקד בתועלת הגדולה ביותר או בתובנה המפתיעה ביותר

2. סיכום (מבט כללי מושך):
   - התחל עם וו: העובדה המפתיעה ביותר, התועלת הגדולה ביותר, או הבעיה הקריטית שזה פותר
   - כתב 3-4 משפטים שנותנים סקירה מקיפה
   - חייב לגעת בכל הנושאים המרכזיים שנדונו
   - סיים עם מה שהקורא ישיג לאחר לימוד זה

3. נקודות מפתח (נקודות כוח):
   - רשום את כל הרעיונות החשובים שהוזכרו בפודקאסט
   - התחל כל אחד עם מילת פעולה או ביטוי כוח
   - כל נקודה צריכה להיות 1-2 משפטים
   - כלול גם נקודות מרכזיות וגם מושגי תמיכה
   - מספר כל נקודה לעיון קל (1., 2., 3., וכו')

4. צלילה עמוקה למושגי ליבה:
   - מספר כל מושג (1., 2., וכו')
   - לכל מושג:
     א) התחל עם שם/כותרת מושג מושכת
     ב) ספק הסבר ברור ב-2-3 משפטים
     ג) כלול ציטוטים רלוונטיים מהתמליל (במירכאות)
     ד) רשום יישומים עם נקודות רשימה (•)
     ה) במידת הצורך, רשום מושגים קשורים עם נקודות רשימה (•)
     ו) במידת הצורך, רשום טעויות נפוצות עם נקודות רשימה (•)

   דוגמת פורמט:
   1. האסטרטגיה המשנה משחק עבור [מושג]
      [הסבר ב-2-3 משפטים המראה למה זה חשוב]
      
      "ציטוט ראשון רלוונטי מהתמליל"
      "ציטוט שני אם זמין"
      
      יישומים:
      • נקודת יישום ראשונה
      • נקודת יישום שנייה
      
      מושגים קשורים:
      • מושג קשור 1
      • מושג קשור 2
      
      טעויות נפוצות:
      • טעות ראשונה
      • טעות שנייה

5. ראיות מומחה והוכחות:
   - כלול 3-4 דוגמאות ספציפיות מהתמליל
   - לכל דוגמה:
     א) הסבר הקשר מלא
     ב) ציטוט ישיר
     ג) למה הדוגמה הזו משמעותית
     ד) איך היא מתחברת למושגים הגדולים יותר

6. תובנות מקצועיות:
   - רשום כל מומחיות או סמכות ספציפית שהוזכרה
   - כלול אישורים או ניסיון שהוזכר
   - לכוד המלצות או אזהרות ספציפיות
   - ציין חילוקי דעות או נקודות מבט חלופיות שהוצגו

7. תוכנית פעולה:
   - צור 5-7 צעדי פעולה עם שמות מושכים
   - כלול פעולות מיידיות וארוכות טווח
   - הוסף דרישות מוקדמות או תלות
   - ציין כלים או משאבים ספציפיים שהוזכרו
   - הפוך כל צעד לספציפי וניתן למדידה

8. משאבים וצעדים הבאים:
   - רשום ספרים, מאמרים, או משאבים שהוזכרו
   - כלול כלים או פלטפורמות מומלצות
   - ציין מתודולוגיות או מסגרות ספציפיות שהוזכרו
   - הוסף למידה המשכית מוצעת

הנחיות חשובות:
- השתמש בציטוטים מדויקים כשאפשר
- שמור על הטרמינולוגיה המקורית של הדובר
- כלול נתונים מספריים או סטטיסטיקות שהוזכרו
- שמור מידע כרונולוגי או רציף
- ציין יחסי סיבה ותוצאה
- לכוד דיונים או נקודות מבט מנוגדות
- כלול דוגמאות מהעולם האמיתי ומקרי בוחן
- שמור הקשר ונואנסים
- הפוך כל כותרת קטע למושכת וממוקדת תועלת

הוצא את השיעור המושלם שלך בתוך תגי <educational_lesson>.` : 
      
      `You are tasked with creating a comprehensive educational lesson from a podcast transcript. Your primary goal is to ensure NO important ideas or concepts are lost from the original content. Follow these detailed instructions:

First, carefully analyze this podcast transcript:

<podcast_transcript>
${truncatedTranscript}
</podcast_transcript>

Create an educational lesson that captures ALL key ideas using this structure:

1. Title (Hook-Style):
   - Create a compelling, attention-grabbing title that makes people want to learn more
   - Use power words, numbers, or intriguing questions when appropriate
   - Examples: "The 3 Secrets That...", "Why Most People Fail At...", "The Hidden Truth About...", "Master the Art of..."
   - Keep it under 12 words but make it irresistible
   - Focus on the biggest benefit or most surprising insight

2. Summary (Compelling Overview):
   - Start with a hook: the most surprising fact, biggest benefit, or critical problem this solves
   - Write 3-4 sentences that provide a comprehensive overview
   - Must touch on ALL major themes discussed
   - End with what the reader will achieve after learning this

3. Key Takeaways (Power Points):
   - List ALL important ideas mentioned in the podcast
   - Start each with an action word or power phrase
   - Each takeaway should be 1-2 sentences
   - Include both major points and supporting concepts
   - Number each takeaway for easy reference (1., 2., 3., etc.)

4. Core Concepts Deep Dive:
   - Number each concept (1., 2., etc.)
   - For each concept:
     a) Start with a compelling concept name/headline
     b) Provide a clear explanation in 2-3 sentences
     c) Include relevant quotes from the transcript (in quotation marks)
     d) List applications with bullet points (•)
     e) If applicable, list related concepts with bullet points (•)
     f) If applicable, list common misconceptions with bullet points (•)

   Example format:
   1. The Game-Changing Strategy for [Concept]
      [Explanation in 2-3 sentences that shows why this matters]
      
      "First relevant quote from transcript"
      "Second relevant quote if available"
      
      Applications:
      • First application point
      • Second application point
      
      Related Concepts:
      • Related concept 1
      • Related concept 2
      
      Common Mistakes:
      • First misconception
      • Second misconception

5. Expert Evidence & Proof:
   - Include 3-4 specific examples from the transcript
   - For each example:
     a) Full context explanation
     b) Direct quote
     c) Why this example is significant
     d) How it connects to the larger concepts

6. Professional Insights:
   - List any specific expertise or authority referenced
   - Include credentials or experience mentioned
   - Capture specific recommendations or warnings
   - Note any disagreements or alternative viewpoints presented

7. Action Blueprint:
   - Create 5-7 actionable steps with compelling names
   - Include both immediate and long-term actions
   - Add any prerequisites or dependencies
   - Note any specific tools or resources mentioned
   - Make each step specific and measurable

8. Resources & Next Steps:
   - List any books, articles, or resources mentioned
   - Include any recommended tools or platforms
   - Note any specific methodologies or frameworks referenced
   - Add suggested follow-up learning

Important Guidelines:
- Use exact quotes whenever possible
- Maintain the speaker's original terminology
- Include numerical data or statistics mentioned
- Preserve any chronological or sequential information
- Note any cause-and-effect relationships
- Capture any debates or contrasting viewpoints
- Include real-world examples and case studies
- Preserve context and nuance
- Make every section title compelling and benefit-focused

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
          content: lessonContent,
          user_id: userId // Include the user ID so RLS policies work correctly
        })
      });

      if (!storeResponse.ok) {
        throw new Error(`Failed to store generated lesson: ${storeResponse.statusText}`);
      }

      // Update episode status to completed
      const finalUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/episodes?id=eq.${episode.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ lesson_generation_status: 'completed' })
      });

      if (!finalUpdateResponse.ok) {
        throw new Error(`Failed to update final episode status: ${finalUpdateResponse.statusText}`);
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
