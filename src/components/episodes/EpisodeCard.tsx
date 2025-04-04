import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause } from "lucide-react";
import { Episode } from "@/types/podcast";
import { PlaybackControls } from "./PlaybackControls";
import { TranscriptionControls } from "./TranscriptionControls";
import { useTranscription } from "@/hooks/useTranscription";
import { formatDuration, stripHtml } from "@/utils/formatters";

interface EpisodeCardProps {
  episode: Episode;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onPlay: () => void;
  onSeek: (value: number[]) => void;
  onSpeedChange: (speed: number) => void;
}

export const EpisodeCard = ({
  episode,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onPlay,
  onSeek,
  onSpeedChange
}: EpisodeCardProps) => {
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
  } = useTranscription(episode.id);

  return (
    <Card className="group hover:bg-accent/5 transition-colors w-full">
      <div className="p-4 flex gap-4">
        {episode.image_url && (
          <div className="flex-shrink-0">
            <img 
              src={episode.image_url} 
              alt={episode.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 w-full">
          <h3 className="text-lg font-semibold mb-1 truncate">{episode.title}</h3>
          {episode.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {stripHtml(episode.description)}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock className="w-4 h-4" />
            {formatDuration(duration)}
          </div>

          <div className="space-y-4 w-full">
            <div className="flex flex-wrap gap-2 w-full">
              <TranscriptionControls
                isLoadingTranscription={isLoadingTranscription}
                isStartingTranscription={isStartingTranscription}
                isGeneratingLesson={isGeneratingLesson}
                isLoadingLesson={isLoadingLesson}
                transcription={transcription}
                lesson={lesson || undefined}
                progress={progress}
                remainingTrialEpisodes={remainingTrialEpisodes}
                hasActiveSubscription={hasActiveSubscription}
                credits={credits}
                onStartTranscription={handleStartTranscription}
                onViewTranscription={handleViewTranscription}
                onCopyTranscription={handleCopyTranscription}
                onGenerateLesson={handleGenerateLesson}
                episodeTitle={episode.title}
              />
              <Button 
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={onPlay}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Episode
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play Episode
                  </>
                )}
              </Button>
            </div>
            
            {isPlaying && (
              <PlaybackControls
                currentTime={currentTime}
                duration={duration}
                playbackRate={playbackRate}
                onSeek={onSeek}
                onSpeedChange={onSpeedChange}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
