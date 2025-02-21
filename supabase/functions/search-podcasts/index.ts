import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`)
    }

    const requestData = await req.json()
    const { query, action, feedId, episodeId } = requestData

    const apiKey = Deno.env.get('PODCASTINDEX_API_KEY')
    const apiSecret = Deno.env.get('PODCASTINDEX_API_SECRET')

    console.log('API credentials check:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      action,
      feedId,
      episodeId
    })

    if (!apiKey || !apiSecret) {
      console.error('Missing API credentials')
      return new Response(
        JSON.stringify({ error: 'API credentials not configured' }),
        { headers: corsHeaders, status: 500 }
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const authString = apiKey + apiSecret + timestamp
    
    const encoder = new TextEncoder()
    const data = encoder.encode(authString)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const authHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const headers = {
      'X-Auth-Date': timestamp.toString(),
      'X-Auth-Key': apiKey,
      'Authorization': authHash,
      'User-Agent': 'LovablePodcastApp/1.0'
    }

    let apiUrl: string
    
    if (action === 'get_episode') {
      if (!episodeId) {
        throw new Error('Episode ID is required for get_episode action')
      }

      apiUrl = `https://api.podcastindex.org/api/1.0/episodes/byid?id=${episodeId}`
      console.log('Fetching episode:', apiUrl)
      
      const episodeResponse = await fetch(apiUrl, { headers })
      if (!episodeResponse.ok) {
        throw new Error(`Failed to fetch episode: ${episodeResponse.statusText}`)
      }
      
      const episodeData = await episodeResponse.json()
      console.log('Episode data received:', episodeData)
      
      if (!episodeData.episode) {
        throw new Error('Episode not found')
      }

      const episode = episodeData.episode

      // First get the podcast details
      const podcastUrl = `https://api.podcastindex.org/api/1.0/podcasts/byfeedid?id=${episode.feedId}`
      console.log('Fetching podcast details:', podcastUrl)
      
      let podcast = null;
      try {
        const podcastResponse = await fetch(podcastUrl, { headers })
        if (podcastResponse.ok) {
          const podcastData = await podcastResponse.json()
          console.log('Podcast data received:', podcastData)
          podcast = podcastData.feed
        } else {
          console.warn('Failed to fetch podcast details, continuing with episode data only')
        }
      } catch (podcastError) {
        console.warn('Error fetching podcast details:', podcastError)
      }

      return new Response(
        JSON.stringify({
          episode: {
            id: episode.id.toString(),
            podcast_id: episode.feedId,
            title: episode.title,
            description: episode.description,
            audio_url: episode.enclosureUrl,
            image_url: episode.image || (podcast?.artwork) || episode.feedImage,
            duration: episode.duration,
            published_at: episode.datePublished ? new Date(episode.datePublished * 1000).toISOString() : null,
            episode_number: episode.episode,
            season_number: episode.season,
            podcast_title: podcast?.title || 'Unknown Podcast',
            podcast_description: podcast?.description || episode.feedTitle || null,
            podcast_image: podcast?.artwork || episode.feedImage || null,
            podcast_author: podcast?.author || episode.feedAuthor || null,
            feed_url: podcast?.url || null,
            website_url: podcast?.link || null,
            language: podcast?.language || null,
            categories: podcast?.categories ? Object.values(podcast.categories) : null
          }
        }),
        { headers: corsHeaders }
      )
    } else if (action === 'get_episodes') {
      // First, fetch the podcast details
      const podcastUrl = `https://api.podcastindex.org/api/1.0/podcasts/byfeedid?id=${feedId}`
      console.log('Fetching podcast details:', podcastUrl)
      
      const podcastResponse = await fetch(podcastUrl, { headers })
      if (!podcastResponse.ok) {
        throw new Error(`Failed to fetch podcast details: ${podcastResponse.statusText}`)
      }
      const podcastData = await podcastResponse.json()
      console.log('Podcast data received:', podcastData)
      const podcast = podcastData.feed

      // Then fetch episodes
      apiUrl = `https://api.podcastindex.org/api/1.0/episodes/byfeedid?id=${feedId}`
      console.log('Fetching episodes:', apiUrl)
      
      const episodesResponse = await fetch(apiUrl, { headers })
      if (!episodesResponse.ok) {
        throw new Error(`Failed to fetch episodes: ${episodesResponse.statusText}`)
      }
      const episodesData = await episodesResponse.json()
      console.log(`Retrieved ${episodesData.items?.length || 0} episodes`)
      
      const episodes = (episodesData.items || []).map((episode: any) => ({
        id: episode.id.toString(),
        title: episode.title,
        description: episode.description,
        audio_url: episode.enclosureUrl,
        image_url: episode.image || podcast.artwork || episode.feedImage,
        duration: episode.duration,
        published_at: episode.datePublished ? new Date(episode.datePublished * 1000).toISOString() : null,
        episode_number: episode.episode,
        season_number: episode.season
      }))

      return new Response(
        JSON.stringify({ 
          episodes,
          podcast: {
            id: podcast.id.toString(),
            title: podcast.title,
            description: podcast.description,
            author: podcast.author,
            image_url: podcast.artwork,
            website_url: podcast.link
          }
        }),
        { headers: corsHeaders }
      )
    } else {
      apiUrl = `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(query.trim())}`
      console.log('Searching podcasts with query:', query.trim())
      
      const apiResponse = await fetch(apiUrl, { headers })
      if (!apiResponse.ok) {
        throw new Error(`Failed to search podcasts: ${apiResponse.statusText}`)
      }
      
      const responseData = await apiResponse.json()
      const podcasts = responseData.feeds.map((feed: any) => ({
        id: feed.id.toString(),
        title: feed.title,
        description: feed.description,
        author: feed.author,
        image_url: feed.artwork,
        feed_url: feed.url,
        categories: feed.categories ? Object.values(feed.categories) : [],
        language: feed.language,
        website_url: feed.link
      }))
      
      return new Response(
        JSON.stringify({ podcasts }),
        { headers: corsHeaders }
      )
    }
  } catch (error) {
    console.error('Function error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name
      }),
      { headers: corsHeaders, status: 500 }
    )
  }
})
