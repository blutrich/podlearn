export interface Database {
  public: {
    Tables: {
      // ... existing code ...
    }
    Functions: {
      // ... existing code ...
      use_credit_and_record_usage: {
        Args: {
          p_user_id: string
          p_episode_id: string
        }
        Returns: boolean
      }
    }
  }
} 