import React, { useState, useEffect } from 'react';
import { Folder, Plus, MoreVertical, Check, Pencil, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface Podcast {
  id: number;
  title: string;
  image_url: string | null;
  // other properties as needed
}

interface PodcastFolder {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  podcasts?: Podcast[];
}

interface PodcastFoldersProps {
  podcast?: Podcast;
  showAddButton?: boolean;
}

export const PodcastFolders: React.FC<PodcastFoldersProps> = ({ podcast, showAddButton = true }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [folders, setFolders] = useState<PodcastFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<PodcastFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [addToFolderDialogOpen, setAddToFolderDialogOpen] = useState(false);
  const [folderContainsPodcast, setFolderContainsPodcast] = useState<Record<string, boolean>>({});
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Check if user is logged in
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    
    checkUser();
  }, []);

  // Load folders
  useEffect(() => {
    if (userId) {
      loadFolders();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  // Load podcasts for a specific folder if podcast prop is not provided
  useEffect(() => {
    if (!podcast && folders.length > 0) {
      loadPodcastsForFolders();
    }
  }, [folders, podcast]);

  // Check if podcast is in folders
  useEffect(() => {
    if (podcast && folders.length > 0) {
      checkPodcastInFolders();
    }
  }, [folders, podcast]);

  const loadFolders = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('podcast_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load folders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPodcastsForFolders = async () => {
    if (!userId || folders.length === 0) return;

    try {
      // For each folder, load its podcasts
      const folderPromises = folders.map(async (folder) => {
        // First get the podcast IDs for this folder
        const { data: folderItems, error: folderItemsError } = await supabase
          .from('podcast_folder_items')
          .select('podcast_id')
          .eq('folder_id', folder.id);

        if (folderItemsError) throw folderItemsError;
        
        if (!folderItems || folderItems.length === 0) {
          return {
            ...folder,
            podcasts: []
          };
        }

        // Now fetch the actual podcast details
        const podcastIds = folderItems.map(item => item.podcast_id);
        
        const { data: podcastsData, error: podcastsError } = await supabase
          .from('podcasts')
          .select('id, title, image_url')
          .in('id', podcastIds);

        if (podcastsError) throw podcastsError;

        return {
          ...folder,
          podcasts: podcastsData || []
        };
      });

      const foldersWithPodcasts = await Promise.all(folderPromises);
      setFolders(foldersWithPodcasts);
    } catch (error) {
      console.error('Error loading folder podcasts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load folder contents. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const checkPodcastInFolders = async () => {
    if (!podcast || !userId) return;

    try {
      const { data, error } = await supabase
        .from('podcast_folder_items')
        .select('folder_id')
        .eq('podcast_id', parseInt(podcast.id.toString()));

      if (error) throw error;

      // Create a map of folder IDs that contain the podcast
      const folderMap: Record<string, boolean> = {};
      data?.forEach(item => {
        folderMap[item.folder_id] = true;
      });

      setFolderContainsPodcast(folderMap);
    } catch (error) {
      console.error('Error checking podcast in folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!userId) return;
    
    try {
      if (!folderName.trim()) {
        toast({
          title: 'Error',
          description: 'Folder name is required',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase
        .from('podcast_folders')
        .insert({
          name: folderName.trim(),
          description: folderDescription.trim() || null,
          user_id: userId
        })
        .select();

      if (error) throw error;

      setFolders([...(data || []), ...folders]);
      setCreateDialogOpen(false);
      setFolderName('');
      setFolderDescription('');

      toast({
        title: 'Success',
        description: 'Folder created successfully',
      });

      // If podcast is provided, add it to the new folder
      if (podcast && data && data[0]) {
        await addPodcastToFolder(data[0].id);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateFolder = async () => {
    if (!selectedFolder) return;
    
    try {
      if (!folderName.trim()) {
        toast({
          title: 'Error',
          description: 'Folder name is required',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('podcast_folders')
        .update({
          name: folderName.trim(),
          description: folderDescription.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedFolder.id);

      if (error) throw error;

      setFolders(folders.map(folder => 
        folder.id === selectedFolder.id 
          ? { 
              ...folder, 
              name: folderName.trim(), 
              description: folderDescription.trim() || null,
              updated_at: new Date().toISOString()
            } 
          : folder
      ));
      
      setEditDialogOpen(false);
      setSelectedFolder(null);
      setFolderName('');
      setFolderDescription('');

      toast({
        title: 'Success',
        description: 'Folder updated successfully',
      });
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to update folder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm('Are you sure you want to delete this folder? This will not delete the podcasts inside it.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('podcast_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      setFolders(folders.filter(folder => folder.id !== folderId));

      toast({
        title: 'Success',
        description: 'Folder deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete folder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addPodcastToFolder = async (folderId: string) => {
    if (!podcast || !userId) return;
    
    try {
      // Check if podcast is already in the folder
      const { data: existingData, error: checkError } = await supabase
        .from('podcast_folder_items')
        .select('id')
        .eq('folder_id', folderId)
        .eq('podcast_id', parseInt(podcast.id.toString()))
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // If podcast already exists in folder, don't add it again
      if (existingData) {
        toast({
          title: 'Info',
          description: 'Podcast is already in this folder',
        });
        return;
      }

      // Add podcast to folder
      const { error } = await supabase
        .from('podcast_folder_items')
        .insert({
          folder_id: folderId,
          podcast_id: parseInt(podcast.id.toString())
        });

      if (error) throw error;

      // Update local state
      setFolderContainsPodcast({
        ...folderContainsPodcast,
        [folderId]: true
      });

      toast({
        title: 'Success',
        description: 'Podcast added to folder',
      });
    } catch (error) {
      console.error('Error adding podcast to folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to add podcast to folder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const removePodcastFromFolder = async (folderId: string) => {
    if (!podcast || !userId) return;
    
    try {
      const { error } = await supabase
        .from('podcast_folder_items')
        .delete()
        .eq('folder_id', folderId)
        .eq('podcast_id', parseInt(podcast.id.toString()));

      if (error) throw error;

      // Update local state
      const newFolderContainsPodcast = { ...folderContainsPodcast };
      delete newFolderContainsPodcast[folderId];
      setFolderContainsPodcast(newFolderContainsPodcast);

      toast({
        title: 'Success',
        description: 'Podcast removed from folder',
      });
    } catch (error) {
      console.error('Error removing podcast from folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove podcast from folder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Function to navigate to podcast episodes
  const goToPodcastEpisodes = (podcastId: number) => {
    // Navigate to the episodes page for this podcast
    // Using a different route pattern that matches the application's router
    navigate(`/episodes/${podcastId}`);
  };

  // If we're showing a single podcast and its folder management
  if (podcast) {
    return (
      <>
        {showAddButton ? (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setAddToFolderDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Folder className="w-4 h-4 mr-2" />
            Add to Folder
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setAddToFolderDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Folder className="w-4 h-4 mr-2" />
            Manage Folders
          </Button>
        )}

        {/* Dialog for adding podcast to folder */}
        <Dialog open={addToFolderDialogOpen} onOpenChange={setAddToFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Folder</DialogTitle>
              <DialogDescription>
                Select a folder or create a new one to organize your podcasts.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {isLoading ? (
                <p className="text-center">Loading folders...</p>
              ) : folders.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {folders.map(folder => (
                    <div key={folder.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        {folder.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{folder.description}</p>
                        )}
                      </div>
                      <Button
                        variant={folderContainsPodcast[folder.id] ? "outline" : "default"}
                        size="sm"
                        onClick={() => folderContainsPodcast[folder.id] 
                          ? removePodcastFromFolder(folder.id) 
                          : addPodcastToFolder(folder.id)
                        }
                      >
                        {folderContainsPodcast[folder.id] ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-2">You don't have any folders yet.</p>
              )}
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => {
                  setCreateDialogOpen(true);
                  setAddToFolderDialogOpen(false);
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Folder
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setAddToFolderDialogOpen(false)}
                className="w-full"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog for creating new folder */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your podcasts.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="My Favorite Podcasts"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="folder-description">Description (optional)</Label>
                <Textarea
                  id="folder-description"
                  placeholder="A collection of my favorite podcasts"
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>
                Create Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // If we're showing the full folder management view
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Podcast Folders</h2>
        <Button onClick={() => {
          setFolderName('');
          setFolderDescription('');
          setCreateDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          New Folder
        </Button>
      </div>
      
      {isLoading ? (
        <p className="text-center py-8">Loading folders...</p>
      ) : folders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map(folder => (
            <Card key={folder.id} className={expandedFolders[folder.id] ? 'border-primary/50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <Folder className={`w-4 h-4 mr-2 ${expandedFolders[folder.id] ? 'text-primary' : ''}`} />
                      {folder.name}
                    </CardTitle>
                    {folder.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {folder.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background/100 backdrop-blur-lg border-border">
                      <DropdownMenuItem onClick={() => {
                        setSelectedFolder(folder);
                        setFolderName(folder.name);
                        setFolderDescription(folder.description || '');
                        setEditDialogOpen(true);
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteFolder(folder.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className={`pb-2 ${expandedFolders[folder.id] ? 'max-h-none' : ''}`}>
                {folder.podcasts && folder.podcasts.length > 0 ? (
                  <div className={`space-y-2 ${expandedFolders[folder.id] ? 'max-h-none' : 'max-h-[200px]'} overflow-y-auto`}>
                    {folder.podcasts.map((podcast, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 p-1 hover:bg-accent rounded-md cursor-pointer transition-colors"
                        onClick={() => goToPodcastEpisodes(podcast.id)}
                      >
                        <div className="w-8 h-8 rounded overflow-hidden">
                          <img 
                            src={podcast.image_url || "/placeholder.svg"} 
                            alt={podcast.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium line-clamp-1">{podcast.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    No podcasts added to this folder yet.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant={expandedFolders[folder.id] ? "default" : "outline"}
                  size="sm" 
                  className="w-full"
                  onClick={() => toggleFolderExpansion(folder.id)}
                >
                  {expandedFolders[folder.id] ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      {folder.podcasts?.length ?? 0} Podcasts
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg mb-4">You haven't created any folders yet.</p>
          <p className="text-muted-foreground mb-6">
            Create folders to organize your favorite podcasts.
          </p>
          <Button onClick={() => {
            setFolderName('');
            setFolderDescription('');
            setCreateDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Folder
          </Button>
        </div>
      )}
      
      {/* Create folder dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your podcasts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="My Favorite Podcasts"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder-description">Description (optional)</Label>
              <Textarea
                id="folder-description"
                placeholder="A collection of my favorite podcasts"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit folder dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update your folder details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Folder Name</Label>
              <Input
                id="edit-folder-name"
                placeholder="My Favorite Podcasts"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-folder-description">Description (optional)</Label>
              <Textarea
                id="edit-folder-description"
                placeholder="A collection of my favorite podcasts"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFolder}>
              Update Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 