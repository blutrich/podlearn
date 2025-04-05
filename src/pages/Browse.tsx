import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Search, Plus, Check, Trash, FolderOpen, Folder } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { PodcastFolders } from "@/components/podcasts/PodcastFolders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Podcast {
  id: number;
  title: string;
  description: string | null;
  author: string | null;
  image_url: string | null;
  feed_url: string;
  website_url: string | null;
  language: string | null;
  categories: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  is_saved?: boolean;
}

async function searchPodcasts(searchTerm: string): Promise<Podcast[]> {
  if (!searchTerm.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_FUNCTIONS_URL}/search-podcasts?q=${encodeURIComponent(searchTerm)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.podcasts || [];
  } catch (error) {
    console.error("Error searching podcasts:", error);
    return [];
  }
}

interface PodcastCardProps {
  podcast: Podcast;
  handleEpisodesClick: (podcastId: number) => void;
  handleSaveButtonClick: (podcast: Podcast) => Promise<void>;
  handleDeletePodcast: (podcastId: number, podcastTitle: string) => Promise<void>;
  isSaved?: boolean;
}

const PodcastCard: React.FC<PodcastCardProps> = ({ podcast, handleEpisodesClick, handleSaveButtonClick, handleDeletePodcast, isSaved = false }) => (
  <Card key={podcast.id} className="podcast-card group">
    <div className="aspect-square sm:aspect-video relative mb-2 rounded-md overflow-hidden">
      <img
        src={podcast.image_url || "/placeholder.svg"}
        alt={podcast.title}
        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
    </div>
    <div className="p-3 space-y-1">
      <h3 className="font-semibold text-base line-clamp-1">{podcast.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
        {podcast.description || "No description available"}
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleEpisodesClick(podcast.id)}
          className="h-8 px-2 py-1"
        >
          <Clock className="w-3 h-3 mr-1" />
          Episodes
        </Button>
        
        {isSaved ? (
          <>
            <PodcastFolders podcast={podcast} showAddButton={false} />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleDeletePodcast(podcast.id, podcast.title)}
              className="h-8 px-2 py-1 text-destructive hover:text-destructive"
            >
              <Trash className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleSaveButtonClick(podcast)}
            className="h-8 px-2 py-1"
          >
            <Plus className="w-3 h-3 mr-1" />
            Save
          </Button>
        )}
      </div>
    </div>
  </Card>
);

const Browse = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState(location.state?.preservedSearch || "");
  const [debouncedQuery, setDebouncedQuery] = React.useState(searchQuery);
  const [savedPodcasts, setSavedPodcasts] = React.useState<Podcast[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>("folders"); // Default to folders view
  
  // Load saved podcasts on component mount
  React.useEffect(() => {
    const fetchSavedPodcasts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get saved podcast IDs
        const { data: savedData, error: savedError } = await supabase
          .from('saved_podcasts')
          .select('podcast_id')
          .eq('user_id', user.id);

        if (savedError) throw savedError;

        if (savedData && savedData.length > 0) {
          // Extract podcast IDs
          const podcastIds = savedData.map(item => item.podcast_id);

          // Fetch podcast details
          const { data: podcastsData, error: podcastsError } = await supabase
            .from('podcasts')
            .select('*')
            .in('id', podcastIds);

          if (podcastsError) throw podcastsError;

          // Mark podcasts as saved
          const podcasts = podcastsData?.map(podcast => ({
            ...podcast,
            is_saved: true
          })) || [];

          setSavedPodcasts(podcasts);
        }
      } catch (error) {
        console.error("Error loading saved podcasts:", error);
        toast({
          title: "Error",
          description: "Failed to load saved podcasts. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchSavedPodcasts();
  }, [toast]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['podcastSearch', debouncedQuery],
    queryFn: async () => {
      const results = await searchPodcasts(debouncedQuery);
      
      // Check which podcasts are already saved by this user
      const { data: { user } } = await supabase.auth.getUser();
      if (user && results.length > 0) {
        // Get saved podcast IDs for this user
        const { data: savedData } = await supabase
          .from('saved_podcasts')
          .select('podcast_id')
          .eq('user_id', user.id);
        
        if (savedData && savedData.length > 0) {
          const savedIds = savedData.map(item => item.podcast_id);
          
          // Mark podcasts as saved
          return results.map(podcast => ({
            ...podcast,
            is_saved: savedIds.includes(podcast.id)
          }));
        }
      }
      
      return results;
    },
    enabled: debouncedQuery.length > 0,
  });

  const handleEpisodesClick = (podcastId: number) => {
    navigate(`/episodes/${podcastId}`, { 
      state: { search: searchQuery } 
    });
  };

  const handleDeletePodcast = async (podcastId: number, podcastTitle: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage your saved podcasts.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('saved_podcasts')
        .delete()
        .eq('user_id', user.id)
        .eq('podcast_id', podcastId);

      if (error) throw error;

      // Update local state
      setSavedPodcasts(prev => prev.filter(podcast => podcast.id !== podcastId));

      toast({
        title: "Removed",
        description: `"${podcastTitle}" removed from your saved podcasts.`,
      });
    } catch (error) {
      console.error("Error deleting podcast:", error);
      toast({
        title: "Error",
        description: "Failed to delete podcast. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveButtonClick = async (podcast: Podcast) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save podcasts.",
          variant: "destructive",
        });
        return;
      }

      if (podcast.is_saved) {
        // Unsave the podcast
        const { error } = await supabase
          .from('saved_podcasts')
          .delete()
          .eq('user_id', user.id)
          .eq('podcast_id', podcast.id);

        if (error) throw error;

        // Update local state
        setSavedPodcasts(prev => prev.filter(p => p.id !== podcast.id));
        
        if (searchResults) {
          const updatedResults = searchResults.map((p: Podcast) => 
            p.id === podcast.id ? { ...p, is_saved: false } : p
          );
          // We can't directly update the query cache, but we can update UI state
        }

        toast({
          title: "Removed",
          description: `"${podcast.title}" removed from your saved podcasts.`,
        });
      } else {
        // First ensure the podcast exists in the podcasts table
        const { data: existingPodcast, error: checkError } = await supabase
          .from('podcasts')
          .select('id')
          .eq('id', podcast.id)
          .maybeSingle();

        if (checkError) throw checkError;

        // If podcast doesn't exist, insert it
        if (!existingPodcast) {
          const { error: insertError } = await supabase
            .from('podcasts')
            .insert({
              id: podcast.id,
              title: podcast.title,
              description: podcast.description,
              author: podcast.author,
              image_url: podcast.image_url,
              feed_url: podcast.feed_url,
              website_url: podcast.website_url,
              language: podcast.language,
              categories: podcast.categories,
            });

          if (insertError) throw insertError;
        }

        // Now save the podcast for this user
        const { error } = await supabase
          .from('saved_podcasts')
          .insert({
            user_id: user.id,
            podcast_id: podcast.id
          });

        if (error) throw error;

        // Update local state
        setSavedPodcasts(prev => [...prev, { ...podcast, is_saved: true }]);
        
        if (searchResults) {
          const updatedResults = searchResults.map((p: Podcast) => 
            p.id === podcast.id ? { ...p, is_saved: true } : p
          );
          // We can't directly update the query cache, but we can update UI state
        }

        toast({
          title: "Saved",
          description: `"${podcast.title}" added to your saved podcasts.`,
        });
      }
    } catch (error) {
      console.error("Error saving/unsaving podcast:", error);
      toast({
        title: "Error",
        description: "Failed to update saved podcasts. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-3 py-4 md:px-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Podcast Library</h1>
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
        
        {savedPodcasts.length > 0 && !debouncedQuery && (
          <div>
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mb-4"
            >
              <TabsList className="w-full h-12 grid grid-cols-2 mb-6 sticky top-0 z-10 bg-background">
                <TabsTrigger value="folders" className="flex items-center gap-1 h-full">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Folders</span>
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-1 h-full">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">All Saved</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="folders" className="mt-0">
                <PodcastFolders />
              </TabsContent>
              
              <TabsContent value="all" className="mt-0">
                <h2 className="text-xl font-semibold mb-4">Your Saved Podcasts</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {savedPodcasts.map((podcast) => (
                    <PodcastCard 
                      key={podcast.id}
                      podcast={podcast}
                      handleEpisodesClick={handleEpisodesClick}
                      handleSaveButtonClick={handleSaveButtonClick}
                      handleDeletePodcast={handleDeletePodcast}
                      isSaved={true}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {debouncedQuery && (
          isLoading ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Searching for podcasts...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-destructive">Error loading results. Please try again.</p>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {searchResults?.map((podcast: Podcast) => {
                  const isSaved = savedPodcasts.some(saved => saved.id === podcast.id);
                  return (
                    <PodcastCard 
                      key={podcast.id}
                      podcast={podcast}
                      handleEpisodesClick={handleEpisodesClick}
                      handleSaveButtonClick={handleSaveButtonClick}
                      handleDeletePodcast={handleDeletePodcast}
                      isSaved={isSaved}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Try searching for a different term or browse our featured podcasts.</p>
            </div>
          )
        )}
        
        {!debouncedQuery && !isLoading && savedPodcasts.length === 0 && (
          <div className="text-center p-6 md:p-12 bg-muted/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">No Saved Podcasts Yet</h2>
            <p className="text-muted-foreground mb-4">
              Search for podcasts above and save them to start building your collection.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
