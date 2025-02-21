
export interface TranscriptionStatus {
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  transcription_error: string | null;
  transcription_started_at: string | null;
}

export interface TranscriptionEntity {
  entity_type: string;
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionSegment {
  content: string;
  speaker: string;
  start_time: number;
  end_time: number;
  sentiment?: string;
  sentiment_confidence?: number;
  entities?: TranscriptionEntity[];
}
