
import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Rewind, FastForward } from "lucide-react";
import { formatTime } from "@/utils/formatters";

interface PlaybackControlsProps {
  currentTime: number;
  duration: number;
  playbackRate: number;
  onSeek: (value: number[]) => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls = ({
  currentTime,
  duration,
  playbackRate,
  onSeek,
  onSpeedChange,
}: PlaybackControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground min-w-[40px]">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={1}
          onValueChange={onSeek}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground min-w-[40px]">
          {formatTime(duration)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSpeedChange(0.5)}
          className={playbackRate === 0.5 ? 'bg-primary text-primary-foreground' : ''}
        >
          <Rewind className="w-4 h-4 mr-1" />
          0.5x
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSpeedChange(1)}
          className={playbackRate === 1 ? 'bg-primary text-primary-foreground' : ''}
        >
          1x
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSpeedChange(1.5)}
          className={playbackRate === 1.5 ? 'bg-primary text-primary-foreground' : ''}
        >
          <FastForward className="w-4 h-4 mr-1" />
          1.5x
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSpeedChange(2)}
          className={playbackRate === 2 ? 'bg-primary text-primary-foreground' : ''}
        >
          <FastForward className="w-4 h-4 mr-1" />
          2x
        </Button>
      </div>
    </div>
  );
};
