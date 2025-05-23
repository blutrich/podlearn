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
    <Card className="group hover:bg-accent/5 transition-colors w-full overflow-hidden">
      <div className="p-3 sm:p-4">
        {/* Header with image and basic info */}
        <div className="flex gap-3 sm:gap-4 mb-4">
          {episode.image_url && (
            <div className="flex-shrink-0">
              <img 
                src={episode.image_url} 
                alt={episode.title}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold mb-1 line-clamp-2 leading-tight">
              {episode.title}
            </h3>
            {episode.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                {stripHtml(episode.description)}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{formatDuration(duration)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons - more compact layout */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <Button 
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto flex-shrink-0"
              onClick={onPlay}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span className="truncate">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span className="truncate">Play Episode</span>
                </>
              )}
            </Button>
          </div>
          
          {isPlaying && (
            <div className="w-full">
              <PlaybackControls
                currentTime={currentTime}
                duration={duration}
                playbackRate={playbackRate}
                onSeek={onSeek}
                onSpeedChange={onSpeedChange}
              />
            </div>
          )}
        </div>

        {/* Transcription controls in a more compact format */}
        <div className="mt-4 w-full">
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
        </div>
      </div>
    </Card>
  );
};
