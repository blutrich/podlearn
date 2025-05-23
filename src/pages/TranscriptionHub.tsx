import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Folder, 
  Grid, 
  List, 
  MoreVertical, 
  Plus, 
  Search, 
  BookOpen, 
  Star,
  Clock,
  Settings,
  Trash2,
  Share,
  Download,
  Loader2,
  Filter,
  SortDesc,
  Grid3X3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface Transcription {
  id: string;
  episode_id: string;
  episode_title: string;
  podcast_title: string;
  podcast_author?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
  folder_id?: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  episode_id: string;
  episode_title?: string;
  podcast_title?: string;
  podcast_author?: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  is_starred?: boolean;
  folder_id?: string;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  created_at: string | null;
  updated_at: string | null;
  parent_id?: string;
  is_expanded?: boolean;
}

const TranscriptionHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "transcriptions" | "lessons" | "starred">("all");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  
  // Data
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Load data
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");
      
      try {
        // Load lessons with error handling - only get lessons by the current user
        let lessonsData: any[] = [];
        try {
          const { data, error } = await supabase
            .from('generated_lessons')
            .select(`
              id,
              title,
              content,
              episode_id,
              created_at,
              updated_at
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          lessonsData = data || [];
        } catch (error) {
          console.error('Error loading lessons:', error);
          // Continue with empty array
        }
        
        // Load transcriptions with error handling - only get episodes the user has interacted with
        let transcriptionsData: any[] = [];
        try {
          // Get episodes the user has used or has lessons for
          const { data: userEpisodeUsage, error: usageError } = await supabase
            .from('user_episode_usage')
            .select('episode_id')
            .eq('user_id', user.id);
          
          if (usageError) {
            console.error('Error fetching user episode usage:', usageError);
          }
          
          // Get episode IDs from user's lessons
          const userLessonEpisodes = lessonsData.map(lesson => lesson.episode_id).filter(Boolean);
          
          // Combine episode IDs from usage and lessons
          const allUserEpisodeIds = [
            ...(userEpisodeUsage ? userEpisodeUsage.map(u => u.episode_id) : []),
            ...userLessonEpisodes
          ];
          
          // Remove duplicates
          const uniqueEpisodeIds = [...new Set(allUserEpisodeIds)];
          
          if (uniqueEpisodeIds.length > 0) {
            // Simplified query without podcast relationship to avoid errors
            const { data, error } = await supabase
              .from('episodes')
              .select(`
                id,
                title,
                original_id,
                podcast_id,
                image_url,
                transcription_status,
                created_at,
                updated_at
              `)
              .in('id', uniqueEpisodeIds)
              .eq('transcription_status', 'completed')
              .order('created_at', { ascending: false });
            
            if (error) throw error;
            transcriptionsData = data || [];
          }
        } catch (error) {
          console.error('Error loading transcriptions:', error);
          // Continue with empty array
        }
        
        // Load folders with error handling - filter by user_id
        let foldersData: any[] = [];
        try {
          const { data, error } = await supabase
            .from('podcast_folders')
            .select(`
              id,
              name,
              description,
              created_at,
              updated_at
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          foldersData = data || [];
        } catch (error) {
          console.error('Error loading folders:', error);
          // Continue with empty array
        }
        
        // Function to fetch episode and podcast info from external API
        const fetchEpisodeInfoFromAPI = async (originalId: string) => {
          try {
            const { data, error } = await supabase.functions.invoke('search-podcasts', {
              body: { 
                action: 'get_episode',
                episodeId: originalId 
              }
            });
            
            if (error) {
              console.warn(`API error for episode ${originalId}:`, error);
              return null;
            }
            return data?.episode || null;
          } catch (error) {
            console.warn(`Error fetching episode info for ${originalId}:`, error);
            return null;
          }
        };
        
        // Format transcriptions with basic info first, then enhance with API data if needed
        const formattedTranscriptions = await Promise.all(
          transcriptionsData.map(async (item) => {
            let podcastTitle = 'Unknown Podcast';
            let podcastImageUrl = null;
            let podcastAuthor = null;
            let episodeImageUrl = item.image_url;
            let episodeTitle = item.title || `Episode ${item.id.slice(-8)}`;
            
            // Try to fetch from API if we have an original_id - with better error handling
            if (item.original_id) {
              try {
                const episodeInfo = await fetchEpisodeInfoFromAPI(item.original_id);
                if (episodeInfo) {
                  podcastTitle = episodeInfo.podcast_title || 'Unknown Podcast';
                  podcastImageUrl = episodeInfo.podcast_image;
                  podcastAuthor = episodeInfo.podcast_author;
                  episodeImageUrl = episodeInfo.image_url || item.image_url;
                  episodeTitle = episodeInfo.title || episodeTitle;
                  
                  // Update the database with the better information (non-blocking)
                  if (episodeInfo.title && episodeInfo.title !== item.title) {
                    // Fire and forget database update
                    (async () => {
                      try {
                        await supabase
                          .from('episodes')
                          .update({ 
                            title: episodeInfo.title,
                            image_url: episodeInfo.image_url 
                          })
                          .eq('id', item.id);
                        console.log(`Updated episode ${item.id} with better info`);
                      } catch (error) {
                        console.warn('Error updating episode info:', error);
                      }
                    })();
                  }
                }
              } catch (error) {
                console.warn('Error fetching episode info:', error);
                // Continue with basic info if API fails
              }
            }
            
            return {
              id: item.id,
              episode_id: item.id,
              episode_title: episodeTitle,
              podcast_title: podcastTitle,
              podcast_author: podcastAuthor || undefined,
              image_url: episodeImageUrl || podcastImageUrl || '/placeholder.svg',
              created_at: item.created_at,
              updated_at: item.updated_at,
              is_starred: false
            };
          })
        );
        
        // Format lessons with episode info safely
        const formattedLessons = await Promise.all(
          lessonsData.map(async (item) => {
            let episodeTitle = 'Unknown Episode';
            let episodeImageUrl = null;
            let podcastTitle = 'Unknown Podcast';
            let podcastImageUrl = null;
            let podcastAuthor = null;
            
            if (item.episode_id) {
              try {
                // Simplified query without podcast relationship
                const { data: episodeData } = await supabase
                  .from('episodes')
                  .select(`
                    id,
                    title,
                    original_id,
                    image_url
                  `)
                  .eq('id', item.episode_id)
                  .single();
                
                if (episodeData) {
                  episodeTitle = episodeData.title || `Episode ${episodeData.id.slice(-8)}`;
                  episodeImageUrl = episodeData.image_url;
                  
                  // Try to fetch from external API if we have original_id
                  if (episodeData.original_id) {
                    try {
                      const episodeInfo = await fetchEpisodeInfoFromAPI(episodeData.original_id);
                      if (episodeInfo) {
                        podcastTitle = episodeInfo.podcast_title || 'Unknown Podcast';
                        podcastImageUrl = episodeInfo.podcast_image;
                        podcastAuthor = episodeInfo.podcast_author;
                        episodeImageUrl = episodeInfo.image_url || episodeData.image_url;
                        episodeTitle = episodeInfo.title || episodeTitle;
                      }
                    } catch (error) {
                      console.warn('Error fetching episode info for lesson:', error);
                    }
                  }
                }
              } catch (error) {
                console.error(`Error loading episode info for lesson ${item.id}:`, error);
              }
            }
            
            return {
              id: item.id,
              title: item.title,
              content: item.content,
              episode_id: item.episode_id,
              episode_title: episodeTitle,
              podcast_title: podcastTitle,
              podcast_author: podcastAuthor || undefined,
              image_url: episodeImageUrl || podcastImageUrl || '/placeholder.svg',
              created_at: item.created_at,
              updated_at: item.updated_at,
              is_starred: false
            };
          })
        );
        
        // Set data
        setTranscriptions(formattedTranscriptions);
        setLessons(formattedLessons);
        setFolders(foldersData.map(folder => ({ 
          ...folder, 
          is_expanded: false,
          description: folder.description || undefined 
        })));
      } catch (error) {
        console.error('Error loading data:', error);
        setHasError(true);
        setErrorMessage('Failed to load data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, toast]);
  
  // Filter items based on search and active tab
  const filteredItems = React.useMemo(() => {
    let items: (Transcription | Lesson)[] = [];
    
    // Add items based on active tab
    if (activeTab === 'all' || activeTab === 'transcriptions') {
      items = [...items, ...transcriptions];
    }
    
    if (activeTab === 'all' || activeTab === 'lessons') {
      items = [...items, ...lessons];
    }
    
    if (activeTab === 'starred') {
      items = items.filter(item => item.is_starred);
    }
    
    // Filter by folder if selected
    if (selectedFolder) {
      items = items.filter(item => item.folder_id === selectedFolder);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        const episodeTitle = 'episode_title' in item ? (item.episode_title || '').toLowerCase() : '';
        const podcastTitle = 'podcast_title' in item ? (item.podcast_title || '').toLowerCase() : '';
        const title = 'title' in item ? item.title.toLowerCase() : '';
        
        return (
          episodeTitle.includes(query) || 
          podcastTitle.includes(query) || 
          title.includes(query)
        );
      });
    }
    
    return items;
  }, [transcriptions, lessons, activeTab, selectedFolder, searchQuery]);
  
  // Handle folder toggle
  const toggleFolder = (folderId: string) => {
    setFolders(folders.map(folder => 
      folder.id === folderId 
        ? { ...folder, is_expanded: !folder.is_expanded }
        : folder
    ));
  };
  
  // Handle folder selection
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(selectedFolder === folderId ? null : folderId);
  };
  
  // Handle item click
  const handleItemClick = (item: Transcription | Lesson) => {
    setSelectedItem(item.id);
    
    // Navigate to the appropriate view
    if ('content' in item) {
      // It's a lesson
      navigate(`/lessons/${item.id}`);
    } else {
      // It's a transcription - navigate to the individual episode view
      navigate(`/episode/${item.episode_id}`);
    }
  };
  
  // Handle star item - simplified without database operations for now
  const handleStarItem = async (item: Transcription | Lesson) => {
    if (!user) return;
    
    // For now, just toggle the local state without database operations
    const isLesson = 'content' in item;
    
    if (isLesson) {
      setLessons(lessons.map(lesson => 
        lesson.id === item.id 
          ? { ...lesson, is_starred: !lesson.is_starred }
          : lesson
      ));
    } else {
      setTranscriptions(transcriptions.map(transcription => 
        transcription.id === item.id 
          ? { ...transcription, is_starred: !transcription.is_starred }
          : transcription
      ));
    }
    
    toast({
      title: item.is_starred ? "Item unstarred" : "Item starred",
      description: `${isLesson ? 'Lesson' : 'Transcription'} ${item.is_starred ? 'removed from' : 'added to'} your starred items.`,
    });
  };
  
  // Handle assign to folder - simplified without database operations for now
  const handleAssignToFolder = async (item: Transcription | Lesson, folderId: string | null) => {
    if (!user) return;
    
    // For now, just update local state without database operations
    const isLesson = 'content' in item;
    
    if (isLesson) {
      setLessons(lessons.map(lesson => 
        lesson.id === item.id 
          ? { ...lesson, folder_id: folderId || undefined }
          : lesson
      ));
    } else {
      setTranscriptions(transcriptions.map(transcription => 
        transcription.id === item.id 
          ? { ...transcription, folder_id: folderId || undefined }
          : transcription
      ));
    }
    
    toast({
      title: folderId ? "Item moved" : "Item removed from folder",
      description: folderId 
        ? `Item moved to ${folders.find(f => f.id === folderId)?.name}` 
        : "Item removed from folder"
    });
  };
  
  // Create new folder
  const createNewFolder = async () => {
    if (!user) return;
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingFolder(true);
    
    try {
      const { data, error } = await supabase
        .from('podcast_folders')
        .insert({
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || null,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Add the new folder to state
      setFolders([...folders, { 
        ...data, 
        is_expanded: false,
        description: data.description || undefined 
      }]);
      
      // Reset form and close dialog
      setNewFolderName("");
      setNewFolderDescription("");
      setShowNewFolderDialog(false);
      
      toast({
        title: "Folder created",
        description: `Folder "${newFolderName}" has been created.`
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };
  
  // Render item card
  const renderItemCard = (item: Transcription | Lesson) => {
    const isLesson = 'content' in item;
    const title = isLesson ? item.title : item.episode_title;
    const subtitle = isLesson 
      ? `Lesson for ${item.episode_title || 'Unknown Episode'}`
      : `Transcription from ${item.podcast_title || 'Unknown Podcast'}`;
    const author = isLesson ? item.podcast_author : item.podcast_author;
    const authorText = author ? ` by ${author}` : '';
    const date = new Date(item.created_at).toLocaleDateString();
    const currentFolder = folders.find(f => f.id === item.folder_id);
    
    // Create a better fallback image
    const imageUrl = item.image_url && item.image_url !== '/placeholder.svg' 
      ? item.image_url 
      : null;
    
    if (viewMode === 'grid') {
      return (
        <Card 
          key={item.id}
          className={cn(
            "cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 bg-gradient-to-br from-background via-background to-muted/20",
            selectedItem === item.id && "ring-2 ring-primary shadow-lg scale-[1.02]"
          )}
          onClick={() => handleItemClick(item)}
        >
          <div className="relative rounded-t-lg overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
            <div className="aspect-[16/10] relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
                  {isLesson ? (
                    <BookOpen className="w-16 h-16 text-primary/70 drop-shadow-sm" />
                  ) : (
                    <FileText className="w-16 h-16 text-primary/70 drop-shadow-sm" />
                  )}
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/10 to-transparent rounded-tl-full"></div>
                  <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-br-full"></div>
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-3 left-3 z-10">
                <div className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm border",
                  isLesson 
                    ? "bg-purple-500/90 text-white border-purple-300/20" 
                    : "bg-blue-500/90 text-white border-blue-300/20"
                )}>
                  {isLesson ? "Lesson" : "Transcription"}
                </div>
              </div>
              
              {/* Star Button */}
              <div className="absolute top-3 right-3 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white border border-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarItem(item);
                  }}
                >
                  <Star 
                    className={cn(
                      "h-4 w-4", 
                      item.is_starred ? "fill-yellow-400 text-yellow-400" : "text-white"
                    )} 
                  />
                </Button>
              </div>
              
              {/* Folder Badge */}
              {currentFolder && (
                <div className="absolute bottom-3 left-3 z-10">
                  <div className="px-2 py-1 text-xs rounded-md bg-black/60 backdrop-blur-sm text-white flex items-center gap-1 border border-white/20">
                    <Folder className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{currentFolder.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <h3 className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={title}>
                {title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {subtitle}
                {authorText && <span className="text-primary/80">{authorText}</span>}
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {date}
              </span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}>
                    {isLesson ? <BookOpen className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleStarItem(item);
                  }}>
                    <Star className="mr-2 h-4 w-4" />
                    {item.is_starred ? "Unstar" : "Star"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                    className="p-0"
                  >
                    <div className="flex items-center px-2 py-1.5 w-full">
                      <Folder className="mr-2 h-4 w-4" />
                      <Select
                        value={item.folder_id || "no-folder-selected"}
                        onValueChange={(value) => {
                          handleAssignToFolder(item, value === "no-folder-selected" ? null : value);
                        }}
                        onOpenChange={(open) => {
                          if (open) {
                            document.body.addEventListener("click", (e) => {
                              e.stopPropagation();
                            }, { once: true });
                          }
                        }}
                      >
                        <SelectTrigger className="border-0 p-0 h-auto w-full justify-start focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Move to folder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-folder-selected">
                            <span className="text-muted-foreground">No folder</span>
                          </SelectItem>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // Enhanced List view
      return (
        <Card
          key={item.id}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border-0 bg-gradient-to-r from-background to-muted/10",
            selectedItem === item.id && "ring-2 ring-primary shadow-md"
          )}
          onClick={() => handleItemClick(item)}
        >
          <div className="flex items-center p-4 gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 relative">
              {imageUrl ? (
                <img 
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {isLesson ? (
                    <BookOpen className="w-8 h-8 text-primary/70" />
                  ) : (
                    <FileText className="w-8 h-8 text-primary/70" />
                  )}
                </div>
              )}
              
              {/* Type Badge */}
              <div className="absolute -top-1 -right-1">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs border-2 border-background",
                  isLesson ? "bg-purple-500" : "bg-blue-500"
                )}>
                  {isLesson ? <BookOpen className="w-3 h-3 text-white" /> : <FileText className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-grow min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors" title={title}>
                  {title}
                </h3>
                <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:inline-block">
                  {date}
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-1">
                {subtitle}
                {authorText && <span className="text-primary/80">{authorText}</span>}
              </p>
              
              {currentFolder && (
                <div className="flex items-center gap-1 mt-1">
                  <Folder className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{currentFolder.name}</span>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStarItem(item);
                }}
              >
                <Star 
                  className={cn(
                    "h-4 w-4", 
                    item.is_starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  )} 
                />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}>
                    {isLesson ? <BookOpen className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleStarItem(item);
                  }}>
                    <Star className="mr-2 h-4 w-4" />
                    {item.is_starred ? "Unstar" : "Star"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                    className="p-0"
                  >
                    <div className="flex items-center px-2 py-1.5 w-full">
                      <Folder className="mr-2 h-4 w-4" />
                      <Select
                        value={item.folder_id || "no-folder-selected"}
                        onValueChange={(value) => {
                          handleAssignToFolder(item, value === "no-folder-selected" ? null : value);
                        }}
                        onOpenChange={(open) => {
                          if (open) {
                            document.body.addEventListener("click", (e) => {
                              e.stopPropagation();
                            }, { once: true });
                          }
                        }}
                      >
                        <SelectTrigger className="border-0 p-0 h-auto w-full justify-start focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Move to folder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-folder-selected">
                            <span className="text-muted-foreground">No folder</span>
                          </SelectItem>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      );
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-2">
              Your Learning Library
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your transcriptions, lessons, and learning progress in one place
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search your learning library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Filters and View Controls */}
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <Select value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "transcriptions" | "lessons" | "starred")}>
                <SelectTrigger className="w-auto gap-2 border-0 bg-muted/50 hover:bg-muted transition-colors">
                  <FileText className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="transcriptions">Episodes Only</SelectItem>
                  <SelectItem value="lessons">Lessons Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
                <SelectTrigger className="w-auto gap-2 border-0 bg-muted/50 hover:bg-muted transition-colors">
                  <SortDesc className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>

              {/* Folder Filter */}
              <Select value={selectedFolder || "no-folder"} onValueChange={(value) => setSelectedFolder(value === "no-folder" ? null : value)}>
                <SelectTrigger className="w-auto gap-2 border-0 bg-muted/50 hover:bg-muted transition-colors">
                  <Folder className="h-4 w-4" />
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-folder">All Folders</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Starred Filter */}
              <Button
                variant={activeTab === "starred" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(activeTab === "starred" ? "all" : "starred")}
                className={cn(
                  "gap-2 border-0 transition-all",
                  activeTab === "starred" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Star className={cn("h-4 w-4", activeTab === "starred" && "fill-current")} />
                Starred
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading your library...</span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-muted via-muted to-muted/50 flex items-center justify-center">
              <FileText className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery ? 
                "No content matches your search criteria. Try adjusting your filters." :
                "Your learning library is empty. Start by finding and transcribing a podcast episode!"
              }
            </p>
            {!searchQuery && (
              <Button asChild className="gap-2">
                <a href="/podcasts">
                  <Plus className="h-4 w-4" />
                  Start Transcribing
                </a>
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-3"
          )}>
            {filteredItems.map(renderItemCard)}
          </div>
        )}
      </div>

      {/* Manage Folders Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Create New Folder
            </DialogTitle>
            <DialogDescription>
              Create a new folder to organize your learning content and lessons.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Create New Folder */}
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    createNewFolder();
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={createNewFolder} 
                disabled={!newFolderName.trim()}
                size="sm"
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Existing Folders */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {folders.map((folder) => (
                <div key={folder.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{folder.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFolderSelect(folder.id)}
                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {folders.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No folders created yet</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TranscriptionHub; 