
export interface Episode {
  id: string;
  title: string;
  description?: string;
  audio_url: string;
  image_url?: string;
  duration?: number;
  published_at?: string;
  episode_number?: number;
  season_number?: number;
}
