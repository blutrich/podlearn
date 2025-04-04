import { TranscriptionSegment } from "@/types/transcription";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatTranscription = (segments: TranscriptionSegment[]): string => {
  // For debugging
  console.log(`Formatting ${segments.length} segments`);
  
  // If there's only one segment and it's a long text (likely a full transcript)
  if (segments.length === 1) {
    const segment = segments[0];
    const contentLength = segment.content.length;
    console.log(`Processing single segment: ${contentLength} chars, time: ${segment.start_time}-${segment.end_time}`);
    
    // If it's a long segment, it's likely a full transcript
    if (contentLength > 200) {
      // Return the raw content with proper formatting
      return segment.content
        .replace(/\n\n+/g, '\n\n') // Normalize line breaks
        .trim();
    }
  }

  // Standard processing for multiple segments or properly segmented content
  return segments
    .map(seg => {
      let text = `[${formatTime(seg.start_time)} - ${formatTime(seg.end_time)}] ${seg.speaker}: ${seg.content}`;
      
      if (seg.sentiment && seg.sentiment !== 'NEUTRAL') {
        text += `\nSentiment: ${seg.sentiment} (${Math.round(seg.sentiment_confidence! * 100)}% confidence)`;
      }

      if (seg.entities && seg.entities.length > 0) {
        text += '\nEntities: ' + seg.entities.map(e => `${e.text} (${e.entity_type})`).join(', ');
      }

      return text;
    })
    .join('\n\n');
};
