
import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

interface UseTranscriptionViewProps {
  episodeId: string;
  user: User | null;
  loadTranscription: (episodeId: string) => Promise<boolean>;
}

export const useTranscriptionView = ({
  episodeId,
  user,
  loadTranscription
}: UseTranscriptionViewProps) => {
  const { toast } = useToast();

  const handleViewTranscription = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view transcriptions.",
        variant: "destructive",
      });
      return;
    }

    await loadTranscription(episodeId);
  }, [episodeId, loadTranscription, toast, user]);

  return {
    handleViewTranscription
  };
};
