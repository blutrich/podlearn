-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create episodes table if it doesn't exist
CREATE TABLE IF NOT EXISTS episodes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    original_id TEXT NOT NULL,
    title TEXT NOT NULL,
    podcast_id TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    transcription_status TEXT DEFAULT 'pending',
    transcription_error TEXT,
    transcription_started_at TIMESTAMPTZ,
    transcription_completed_at TIMESTAMPTZ,
    transcription_timeout_at TIMESTAMPTZ,
    assemblyai_transcript_id TEXT,
    max_transcription_duration TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transcriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transcriptions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    episode_id uuid REFERENCES episodes(id),
    content TEXT NOT NULL,
    speaker TEXT,
    start_time FLOAT,
    end_time FLOAT,
    sentiment TEXT,
    sentiment_confidence FLOAT,
    entities JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_episodes_original_id ON episodes(original_id);
CREATE INDEX IF NOT EXISTS idx_episodes_transcription_status ON episodes(transcription_status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_episode_id ON transcriptions(episode_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_start_time ON transcriptions(start_time);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_episodes_updated_at
    BEFORE UPDATE ON episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create stored procedure for updating episode status
CREATE OR REPLACE FUNCTION update_episode_status(
  p_episode_id UUID,
  p_status TEXT,
  p_completed_at TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  UPDATE episodes
  SET 
    transcription_status = p_status,
    transcription_completed_at = p_completed_at
  WHERE id = p_episode_id;
END;
$$ LANGUAGE plpgsql; 