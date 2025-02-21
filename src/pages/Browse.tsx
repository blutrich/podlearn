
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

interface Podcast {
  id: number;
  title: string;
  description?: string;
  author?: string;
  image_url?: string;
  feed_url: string;
  categories?: string[];
  language?: string;
  website_url?: string;
}

async function searchPodcasts(query: string) {
  if (!query.trim()) return [];
  
  try {
    const { data, error } = await supabase.functions.invoke('search-podcasts', {
      body: { query: query.trim() }
    });
    
    if (error) throw error;
    return data.podcasts.map((podcast: any) => ({
      ...podcast,
      id: parseInt(podcast.id)
    }));
  } catch (error) {
    console.error('Error searching podcasts:', error);
    throw error;
  }
}

async function savePodcast(podcast: Podcast) {
  const { data, error } = await supabase
    .from('podcasts')
    .upsert([podcast], {
      onConflict: 'feed_url'
    });
  
  if (error) throw error;
  return data;
}

const Browse = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState(location.state?.preservedSearch || "");
  const [debouncedQuery, setDebouncedQuery] = React.useState(searchQuery);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['podcastSearch', debouncedQuery],
    queryFn: () => searchPodcasts(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const savePodcastMutation = useMutation({
    mutationFn: savePodcast,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Podcast saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save podcast",
        variant: "destructive",
      });
    },
  });

  const handleEpisodesClick = (podcastId: number) => {
    navigate(`/episodes/${podcastId}`, { 
      state: { search: searchQuery } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Browse Podcasts</h1>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="podcast-card animate-pulse">
                <div className="aspect-video bg-muted"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-4">
            Failed to load podcasts. Please try again later.
          </div>
        ) : searchResults?.length === 0 && debouncedQuery ? (
          <div className="text-center text-muted-foreground p-4">
            No podcasts found. Try a different search term.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {searchResults?.map((podcast: Podcast) => (
              <Card key={podcast.id} className="podcast-card group">
                <div className="aspect-video relative mb-4 rounded-md overflow-hidden">
                  <img
                    src={podcast.image_url || "/placeholder.svg"}
                    alt={podcast.title}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-base md:text-lg line-clamp-1">{podcast.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {podcast.description || "No description available"}
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-sm text-primary">{podcast.author || "Unknown author"}</span>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => savePodcastMutation.mutate(podcast)}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEpisodesClick(podcast.id)}
                        className="w-full sm:w-auto"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        View episodes
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
