
import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export const useTranscriptionCopy = () => {
  const { toast } = useToast();

  const handleCopyTranscription = useCallback(async (transcription: string) => {
    if (!transcription) {
      toast({
        title: "No Transcription",
        description: "Please view the transcription first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(transcription);
      toast({
        title: "Copied!",
        description: "Transcription copied to clipboard.",
      });
    } catch (error) {
      console.error('Error copying transcription:', error);
      toast({
        title: "Error",
        description: "Failed to copy transcription. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return { handleCopyTranscription };
};
