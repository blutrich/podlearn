import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Share, Download, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";

interface Lesson {
  id: string;
  title: string;
  content: string;
  episode_id: string;
  created_at: string;
  updated_at: string;
}

interface Episode {
  id: string;
  title: string;
  podcast_id: string;
  image_url?: string;
}

interface Podcast {
  id: string;
  title: string;
  image_url?: string;
}

const Lesson = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    const loadLesson = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load lesson data
        const { data: lessonData, error: lessonError } = await supabase
          .from('generated_lessons')
          .select('*')
          .eq('id', id)
          .single();

        if (lessonError) {
          if (lessonError.code === 'PGRST116') {
            setError('Lesson not found');
          } else {
            throw lessonError;
          }
          return;
        }

        setLesson(lessonData);

        // Load episode data
        if (lessonData.episode_id) {
          const { data: episodeData, error: episodeError } = await supabase
            .from('episodes')
            .select('id, title, podcast_id, image_url')
            .eq('id', lessonData.episode_id)
            .single();

          if (episodeError) {
            console.error('Error loading episode:', episodeError);
          } else {
            setEpisode(episodeData);

            // Load podcast data
            if (episodeData.podcast_id) {
              const { data: podcastData, error: podcastError } = await supabase
                .from('podcasts')
                .select('id, title, image_url')
                .eq('id', episodeData.podcast_id)
                .single();

              if (podcastError) {
                console.error('Error loading podcast:', podcastError);
              } else {
                setPodcast(podcastData);
              }
            }
          }
        }

        // Check if lesson is starred by current user
        const { data: savedItem, error: savedError } = await supabase
          .from('user_saved_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_id', id)
          .eq('item_type', 'lesson')
          .single();

        if (savedError && savedError.code !== 'PGRST116') {
          console.error('Error checking saved status:', savedError);
        } else if (savedItem) {
          setIsStarred(true);
        }
      } catch (error) {
        console.error('Error loading lesson:', error);
        setError('Failed to load lesson');
        toast({
          title: 'Error',
          description: 'Failed to load lesson. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLesson();
  }, [id, user, toast]);

  const handleStarToggle = async () => {
    if (!user || !lesson) return;

    try {
      if (isStarred) {
        // Remove from starred
        const { error } = await supabase
          .from('user_saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', lesson.id)
          .eq('item_type', 'lesson');

        if (error) throw error;

        setIsStarred(false);
        toast({
          title: 'Lesson removed',
          description: 'Lesson removed from your saved items.'
        });
      } else {
        // Add to starred
        const { error } = await supabase
          .from('user_saved_items')
          .insert({
            user_id: user.id,
            item_id: lesson.id,
            item_type: 'lesson',
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        setIsStarred(true);
        toast({
          title: 'Lesson saved',
          description: 'Lesson added to your saved items.'
        });
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lesson status.',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: lesson?.title || 'Lesson',
          text: `Check out this lesson: ${lesson?.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied',
          description: 'Lesson link copied to clipboard.'
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to copy link.',
          variant: 'destructive'
        });
      }
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <Skeleton className="h-10 w-24 mb-4" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !lesson) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
              <p className="text-muted-foreground mb-6">
                {error || 'The lesson you are looking for does not exist.'}
              </p>
              <Button onClick={() => navigate('/transcriptions')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Transcriptions
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const createdDate = new Date(lesson.created_at).toLocaleDateString();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/transcriptions')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transcriptions
            </Button>

            <div className="flex items-start gap-4">
              {(episode?.image_url || podcast?.image_url) && (
                <img
                  src={episode?.image_url || podcast?.image_url}
                  alt={lesson.title}
                  className="w-20 h-20 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              <div className="flex-grow">
                <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {episode && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Episode: {episode.title}
                    </span>
                  )}
                  {podcast && (
                    <span>Podcast: {podcast.title}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {createdDate}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={isStarred ? "default" : "outline"}
                    size="sm"
                    onClick={handleStarToggle}
                  >
                    <Star className={`mr-2 h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
                    {isStarred ? 'Saved' : 'Save'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{lesson.content}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Lesson; 