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

async function searchPodcasts(query: string) {
  if (!query.trim()) return [];
  
  try {
    // First try to search in our local database
    const { data: localResults, error: localError } = await supabase
      .from('podcasts')
      .select('*')
      .ilike('title', `%${query.trim()}%`)
      .order('title');
    
    if (localError) throw localError;
    
    // If we have enough local results, return those
    if (localResults && localResults.length > 5) {
      return localResults.map(podcast => ({
        ...podcast,
        is_saved: false  // This will be updated later when checking saved podcasts
      }));
    }
    
    // Otherwise, also search external API
    const { data, error } = await supabase.functions.invoke('search-podcasts', {
      body: { query: query.trim() }
    });
    
    if (error) throw error;
    
    // Format external results
    const externalResults = data.podcasts.map((podcast: any) => ({
      id: parseInt(podcast.id),
      title: podcast.title || 'Untitled Podcast',
      description: podcast.description,
      author: podcast.author,
      image_url: podcast.image_url,
      feed_url: podcast.feed_url || '',
      website_url: podcast.website_url,
      language: podcast.language,
      categories: podcast.categories,
      is_saved: false
    }));
    
    // Combine local and external results, removing duplicates by ID
    const allResults = [...localResults];
    externalResults.forEach((extPodcast: Podcast) => {
      if (!allResults.some(local => local.id === extPodcast.id)) {
        allResults.push(extPodcast);
      }
    });
    
    return allResults;
  } catch (error) {
    console.error('Error searching podcasts:', error);
    throw error;
  }
}

const Browse = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState(location.state?.preservedSearch || "");
  const [debouncedQuery, setDebouncedQuery] = React.useState(searchQuery);
  const [savedPodcasts, setSavedPodcasts] = React.useState<Podcast[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>("all"); // 'all' or 'folders'
  
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
    if (!window.confirm(`Are you sure you want to delete "${podcastTitle}" from your saved podcasts?`)) {
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('saved_podcasts')
        .delete()
        .eq('podcast_id', podcastId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to delete podcast: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setSavedPodcasts((prev) => prev.filter((p) => p.id !== podcastId));
      
      toast({
        title: "Podcast Deleted",
        description: `"${podcastTitle}" has been removed from your saved podcasts.`,
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
          title: "Authentication Required",
          description: "Please sign in to save podcasts.",
          variant: "destructive",
        });
        return;
      }

      if (podcast.is_saved) {
        // Unsave podcast
        const { error } = await supabase
          .from('saved_podcasts')
          .delete()
          .eq('podcast_id', podcast.id)
          .eq('user_id', user.id);

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
        
        {savedPodcasts.length > 0 && !debouncedQuery && (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  All Saved
                </TabsTrigger>
                <TabsTrigger value="folders" className="flex items-center gap-1">
                  <FolderOpen className="h-4 w-4" />
                  Folders
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all">
              <h2 className="text-xl font-semibold mb-4">Your Saved Podcasts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {savedPodcasts.map((podcast) => (
                  <Card key={podcast.id} className="podcast-card group">
                    <div className="aspect-video relative mb-4 rounded-md overflow-hidden">
                      <img
                        src={podcast.image_url || "/placeholder.svg"}
                        alt={podcast.title}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
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
                            onClick={() => handleEpisodesClick(podcast.id)}
                            className="w-full sm:w-auto"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            View episodes
                          </Button>
                          <PodcastFolders podcast={podcast} showAddButton={false} />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePodcast(podcast.id, podcast.title)}
                            className="w-full sm:w-auto text-destructive hover:text-destructive"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="folders">
              <PodcastFolders />
            </TabsContent>
          </Tabs>
        )}

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
        ) : searchResults && searchResults.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {searchResults?.map((podcast: Podcast) => {
                // Check if this podcast is already saved
                const isSaved = savedPodcasts.some(saved => saved.feed_url === podcast.feed_url);
                
                return (
                  <Card key={podcast.id} className="podcast-card group">
                    <div className="aspect-video relative mb-4 rounded-md overflow-hidden">
                      <img
                        src={podcast.image_url || "/placeholder.svg"}
                        alt={podcast.title}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Replace broken images with placeholder
                          e.currentTarget.src = "/placeholder.svg";
                        }}
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
                          {isSaved ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full sm:w-auto bg-muted/50"
                              disabled
                            >
                              <Check className="w-4 h-4 mr-2 text-green-500" />
                              Saved
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSaveButtonClick(podcast)}
                              className="w-full sm:w-auto"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                          )}
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
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Try searching for a different term or browse our featured podcasts.</p>
          </div>
        )}
        
        {!debouncedQuery && !isLoading && savedPodcasts.length === 0 && (
          <div className="text-center p-12 bg-muted/30 rounded-lg">
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
