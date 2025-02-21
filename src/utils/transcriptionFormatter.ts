
import { TranscriptionSegment } from "@/types/transcription";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatTranscription = (segments: TranscriptionSegment[]): string => {
  return segments
    .map(seg => {
      let text = `[${formatTime(seg.start_time)} - ${formatTime(seg.end_time)}] ${seg.speaker}: ${seg.content}`;
      
      if (seg.sentiment) {
        text += `\nSentiment: ${seg.sentiment} (${Math.round(seg.sentiment_confidence! * 100)}% confidence)`;
      }

      if (seg.entities && seg.entities.length > 0) {
        text += '\nEntities: ' + seg.entities.map(e => `${e.text} (${e.entity_type})`).join(', ');
      }

      return text;
    })
    .join('\n\n');
};
