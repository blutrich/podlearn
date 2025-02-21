
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useAudioPlayer = () => {
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    if (audio) {
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [audio]);

  const handlePlay = (episodeId: string, audioUrl: string) => {
    if (playingEpisodeId === episodeId) {
      audio?.pause();
      setPlayingEpisodeId(null);
      setAudio(null);
    } else {
      if (audio) {
        audio.pause();
      }

      const newAudio = new Audio(audioUrl);
      newAudio.playbackRate = playbackRate;
      newAudio.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "Playback Error",
          description: "Unable to play this episode. Please try again.",
          variant: "destructive",
        });
      });

      setAudio(newAudio);
      setPlayingEpisodeId(episodeId);

      newAudio.onended = () => {
        setPlayingEpisodeId(null);
        setAudio(null);
      };
    }
  };

  const handleSeek = (value: number[]) => {
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (audio) {
      audio.playbackRate = newSpeed;
      setPlaybackRate(newSpeed);
      toast({
        title: "Playback Speed",
        description: `Speed set to ${newSpeed}x`,
      });
    }
  };

  return {
    playingEpisodeId,
    currentTime,
    duration,
    playbackRate,
    handlePlay,
    handleSeek,
    handleSpeedChange
  };
};
