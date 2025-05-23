import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Episode } from "@/types/podcast";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

async function fetchEpisodesAndPodcast(podcastId: string) {
  try {
    console.log('Fetching episodes for podcast ID:', podcastId);
    
    const numericId = parseInt(podcastId);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error(`Invalid podcast ID format: ${podcastId}. Expected a positive number.`);
    }
    
    const { data, error } = await supabase.functions.invoke('search-podcasts', {
      body: { 
        action: 'get_episodes',
        feedId: numericId 
      }
    });
    
    if (error) throw error;
    console.log(`Retrieved ${data?.episodes?.length || 0} episodes and podcast info`);
    return data;
  } catch (error) {
    console.error('Error in fetchEpisodesAndPodcast:', error);
    throw error;
  }
}

const Episodes = () => {
  const { podcastId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { 
    playingEpisodeId, 
    currentTime, 
    duration, 
    playbackRate,
    handlePlay, 
    handleSeek, 
    handleSpeedChange 
  } = useAudioPlayer();

  const { data, isLoading, error } = useQuery({
    queryKey: ['episodes', podcastId],
    queryFn: () => fetchEpisodesAndPodcast(podcastId!),
    enabled: !!podcastId,
    retry: false,
    meta: {
      onError: (error: any) => {
        console.log('Query error:', error);
        toast({
          title: "Error loading episodes",
          description: "Failed to load episodes. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const handleBack = () => {
    const searchState = location.state?.search || '';
    navigate('/browse', { state: { preservedSearch: searchState } });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 max-w-5xl">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-2 -ml-2"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>
          
          {data?.podcast && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mt-4">
              {data.podcast.image_url && (
                <img 
                  src={data.podcast.image_url} 
                  alt={data.podcast.title}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight line-clamp-2">
                  {data.podcast.title}
                </h1>
                {data.podcast.author && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {data.podcast.author}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-32 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-4 rounded-lg bg-destructive/10">
            Failed to load episodes. Please try again later.
          </div>
        ) : !data?.episodes?.length ? (
          <div className="text-center text-muted-foreground p-4 rounded-lg bg-muted">
            No episodes found for this podcast.
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {data.episodes.map((episode: Episode) => (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                isPlaying={playingEpisodeId === episode.id}
                currentTime={currentTime}
                duration={duration}
                playbackRate={playbackRate}
                onPlay={() => handlePlay(episode.id, episode.audio_url)}
                onSeek={handleSeek}
                onSpeedChange={handleSpeedChange}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Episodes;
