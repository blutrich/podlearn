
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
    progress,
    handleStartTranscription,
    handleGenerateLesson,
    handleViewTranscription,
    handleCopyTranscription,
  } = useTranscription(episode.id);

  return (
    <Card className="group hover:bg-accent/5 transition-colors">
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
        <div className="flex-grow space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-base sm:text-lg">{episode.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {stripHtml(episode.description || '')}
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <div className="flex items-center text-sm text-muted-foreground gap-3">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(episode.duration)}
              </div>
              {episode.published_at && (
                <time>
                  {new Date(episode.published_at).toLocaleDateString()}
                </time>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <TranscriptionControls
                isLoadingTranscription={isLoadingTranscription}
                isStartingTranscription={isStartingTranscription}
                isGeneratingLesson={isGeneratingLesson}
                transcription={transcription}
                progress={progress}
                onStartTranscription={handleStartTranscription}
                onViewTranscription={handleViewTranscription}
                onCopyTranscription={handleCopyTranscription}
                onGenerateLesson={handleGenerateLesson}
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
