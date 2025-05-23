import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useTranscription } from "@/hooks/useTranscription";
import { TranscriptionControls } from "@/components/episodes/TranscriptionControls";
import { PlaybackControls } from "@/components/episodes/PlaybackControls";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { Skeleton } from "@/components/ui/skeleton";

interface EpisodeData {
  id: string;
  title: string;
  original_id: string;
  image_url?: string;
  audio_url?: string;
  created_at: string;
  podcast?: {
    id: number;
    title: string;
    author?: string;
    image_url?: string;
  };
}

async function fetchEpisode(episodeId: string): Promise<EpisodeData> {
  const { data, error } = await supabase
    .from('episodes')
    .select(`
      id,
      title,
      original_id,
      image_url,
      audio_url,
      created_at,
      podcasts(
        id,
        title,
        author,
        image_url
      )
    `)
    .eq('id', episodeId)
    .single();

  if (error) throw error;
  
  return {
    ...data,
    podcast: data.podcasts || undefined
  };
}

const EpisodeView = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: episode, isLoading, error } = useQuery({
    queryKey: ['episode', episodeId],
    queryFn: () => fetchEpisode(episodeId!),
    enabled: !!episodeId,
    retry: false,
    meta: {
      onError: (error: any) => {
        console.log('Query error:', error);
        toast({
          title: "Error loading episode",
          description: "Failed to load episode. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const {
    isGeneratingLesson,
    isStartingTranscription,
    transcription,
    isLoadingTranscription,
    isLoadingLesson,
    progress,
    lesson,
    remainingTrialEpisodes,
    hasActiveSubscription,
    credits,
    handleStartTranscription,
    handleGenerateLesson,
    handleViewTranscription,
    handleCopyTranscription,
  } = useTranscription(episode?.original_id || '');

  const { 
    playingEpisodeId, 
    currentTime, 
    duration, 
    playbackRate,
    handlePlay, 
    handleSeek, 
    handleSpeedChange 
  } = useAudioPlayer();

  const handleBack = () => {
    navigate('/transcriptions');
  };

  const handlePlayEpisode = () => {
    if (episode?.audio_url && episode.original_id) {
      handlePlay(episode.original_id, episode.audio_url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-4 w-full">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-2 -ml-2"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Library
            </Button>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
              <Skeleton className="w-32 h-32 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-4 w-full">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-2 -ml-2"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Library
            </Button>
          </div>
          
          <div className="text-center text-destructive p-4 rounded-lg bg-destructive/10">
            Failed to load episode. Please try again later.
          </div>
        </main>
      </div>
    );
  }

  const isPlaying = playingEpisodeId === episode.original_id;
  const episodeTitle = episode.title || `Episode ${episode.original_id}`;
  const podcastTitle = episode.podcast?.title || 'Unknown Podcast';
  const podcastAuthor = episode.podcast?.author;
  const imageUrl = episode.image_url || episode.podcast?.image_url;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 -ml-2"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning Library
          </Button>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4">
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt={episodeTitle}
                className="w-32 h-32 rounded-xl object-cover shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="flex-grow">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{episodeTitle}</h1>
              <p className="text-base text-muted-foreground mb-2">
                From <span className="font-medium">{podcastTitle}</span>
                {podcastAuthor && <span> by {podcastAuthor}</span>}
              </p>
              <div className="text-sm text-muted-foreground">
                Created on {new Date(episode.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Audio Controls */}
        {episode.audio_url && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant={isPlaying ? "secondary" : "default"}
                size="lg"
                onClick={handlePlayEpisode}
                className="px-6"
              >
                {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {isPlaying ? "Pause Episode" : "Play Episode"}
              </Button>
              <div className="text-sm text-muted-foreground">
                🎧 Audio playback available
              </div>
            </div>
            <PlaybackControls
              currentTime={currentTime}
              duration={duration}
              playbackRate={playbackRate}
              onSeek={handleSeek}
              onSpeedChange={handleSpeedChange}
            />
          </div>
        )}

        {/* Transcription Controls */}
        <TranscriptionControls
          isLoadingTranscription={isLoadingTranscription}
          isStartingTranscription={isStartingTranscription}
          isGeneratingLesson={isGeneratingLesson}
          isLoadingLesson={isLoadingLesson}
          transcription={transcription}
          lesson={lesson}
          progress={progress}
          remainingTrialEpisodes={remainingTrialEpisodes}
          hasActiveSubscription={hasActiveSubscription}
          credits={credits}
          onStartTranscription={handleStartTranscription}
          onViewTranscription={handleViewTranscription}
          onCopyTranscription={handleCopyTranscription}
          onGenerateLesson={handleGenerateLesson}
          episodeTitle={episodeTitle}
        />
      </div>
    </div>
  );
};

export default EpisodeView; 