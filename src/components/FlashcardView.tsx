import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RotateCcw, ChevronRight, ArrowLeft, Eye, EyeOff, BookOpen, Lightbulb, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { calculateAnkiSM2, SM2_BUTTON_CONFIG, type SM2Rating, type AnkiCardProgress, CARD_STATES } from "@/utils/sm2Algorithm";

interface FlashcardViewProps {
  deckId?: string;
  onBackToDashboard: () => void;
}

interface StudyCard {
  id: string;
  front: string;
  back: string;
  easiness_factor: number;
  repetition_count: number;
  interval_days: number;
  next_review_date: string;
  last_reviewed_date?: string;
}

const FlashcardView = ({ deckId, onBackToDashboard }: FlashcardViewProps) => {
  const [studyCards, setStudyCards] = useState<StudyCard[]>([]);
  const [deckName, setDeckName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (deckId) {
      fetchCards();
    }
  }, [deckId]);

  const fetchCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to study flashcards.",
          variant: "destructive",
        });
        return;
      }

      // Fetch deck info
      const { data: deckData } = await supabase
        .from('decks')
        .select('name')
        .eq('id', deckId)
        .single();

      // Fetch cards with their progress using direct query
      const { data: cardsData, error } = await supabase
        .from('cards')
        .select('id, front, back')
        .eq('deck_id', deckId);

      if (error) throw error;

      // Check each card's progress to see if it's due for review
      const dueCards: StudyCard[] = [];
      
      if (cardsData) {
        for (const card of cardsData) {
          try {
            // Get card progress using existing RPC function  
            const progressResult = await (supabase as any)
              .rpc('get_card_progress', { 
                p_user_id: user.id, 
                p_card_id: card.id 
              });
            const progressData = progressResult.data;

            if (!progressData) {
              // New card - add to study
              dueCards.push({
                id: card.id,
                front: card.front,
                back: card.back,
                easiness_factor: 2.5,
                repetition_count: 0,
                interval_days: 1,
                next_review_date: new Date(Date.now() - 86400000).toISOString() // Yesterday
              });
            } else {
              // Check if card is due
              const nextReview = new Date(progressData.next_review_date);
              if (nextReview <= new Date()) {
                dueCards.push({
                  id: card.id,
                  front: card.front,
                  back: card.back,
                  easiness_factor: progressData.easiness_factor,
                  repetition_count: progressData.repetition_count,
                  interval_days: progressData.interval_days,
                  next_review_date: progressData.next_review_date,
                  last_reviewed_date: progressData.last_reviewed_date
                });
              }
            }
          } catch (progressError) {
            console.error('Error checking card progress:', progressError);
            // Add as new card if progress check fails
            dueCards.push({
              id: card.id,
              front: card.front,
              back: card.back,
              easiness_factor: 2.5,
              repetition_count: 0,
              interval_days: 1,
              next_review_date: new Date(Date.now() - 86400000).toISOString()
            });
          }
        }
      }

      setDeckName(deckData?.name || "Study Deck");
      setStudyCards(dueCards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentCard = studyCards[currentCardIndex];
  const totalCards = studyCards.length;
  const progress = totalCards > 0 ? (completedCards.size / totalCards) * 100 : 0;

  const handleNextCard = () => {
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // Session complete
      toast({
        title: "Session Complete!",
        description: `You've completed ${completedCards.size} out of ${totalCards} cards.`,
      });
    }
  };

  const handleSM2Rating = async (rating: SM2Rating) => {
    if (!currentCard) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get existing progress from current card
      const currentProgress: AnkiCardProgress | undefined = currentCard.repetition_count > 0 ? {
        state: 'review' as const,
        easiness_factor: currentCard.easiness_factor,
        interval_days: currentCard.interval_days,
        repetitions: currentCard.repetition_count,
        lapses: 0,
        learning_step: 0,
        next_review_date: currentCard.next_review_date
      } : undefined;

      // Calculate new SM2 parameters
      const sm2Result = calculateAnkiSM2(rating, currentProgress);

      // Save progress to database using existing RPC function
      await (supabase as any)
        .rpc('upsert_card_progress', {
          p_user_id: user.id,
          p_card_id: currentCard.id,
          p_easiness_factor: sm2Result.easinessFactor,
          p_repetition_count: sm2Result.repetitions,
          p_interval_days: sm2Result.intervalDays,
          p_next_review_date: sm2Result.nextReviewDate.toISOString(),
          p_last_reviewed_date: new Date().toISOString()
        });


      // Format interval display
      const getIntervalDisplay = (intervalDays: number) => {
        if (intervalDays < 1) {
          const minutes = Math.round(intervalDays * 24 * 60);
          return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (intervalDays === 1) {
          return '1 day';
        } else {
          return `${intervalDays} days`;
        }
      };

      const ratingLabel = SM2_BUTTON_CONFIG.find(c => c.value === rating)?.label || 'Unknown';
      const intervalDisplay = getIntervalDisplay(sm2Result.intervalDays);
      
      let description = `Card will appear again in ${intervalDisplay}.`;
      
      if (sm2Result.isLeech) {
        description += " ⚠️ Leech detected!";
      }
      
      if (sm2Result.graduatedFromLearning) {
        description += " 🎓 Graduated to review!";
      }
      
      toast({
        title: `Rated "${ratingLabel}"`,
        description,
      });

      // Remove card from study session
      const newStudyCards = studyCards.filter((_, index) => index !== currentCardIndex);
      setStudyCards(newStudyCards);
      setCompletedCards(prev => new Set([...prev, currentCard.id]));
      
      // Adjust current index if needed
      if (currentCardIndex >= newStudyCards.length && newStudyCards.length > 0) {
        setCurrentCardIndex(newStudyCards.length - 1);
      } else if (newStudyCards.length === 0) {
        // Session complete
        toast({
          title: "Session Complete!",
          description: `You've completed all available cards.`,
        });
      }
      
      setShowAnswer(false);
    } catch (error) {
      console.error('Error processing SM2 rating:', error);
      
      toast({
        title: "Error",
        description: `Failed to save progress. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setCompletedCards(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (studyCards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        {/* Header */}
        <header className="border-b border-border/40 backdrop-blur-sm bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">OLevelX</h1>
              </div>
              <Button variant="outline" onClick={onBackToDashboard}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-20 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Cards Due</h2>
          <p className="text-muted-foreground mb-6">All cards have been studied! Come back later for reviews.</p>
          <Button onClick={onBackToDashboard}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">OLevelX</h1>
            </div>
            <Button variant="outline" onClick={onBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Study Instructions */}
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Spaced Repetition:</strong> Rate each card honestly to optimize your learning. 
            Cards you find difficult will appear more frequently, while easy cards will be spaced out longer.
          </AlertDescription>
        </Alert>

        {/* Deck Title and Progress */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">{deckName}</h2>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge variant="outline" className="px-3 py-1">
              Card {currentCardIndex + 1} of {totalCards}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              {completedCards.size} completed
            </Badge>
          </div>
          <Progress value={progress} className="max-w-md mx-auto h-2" />
        </div>

        {/* Main Flashcard */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card 
            className="h-96 cursor-pointer transition-all duration-300 hover:shadow-lg border-border/50"
            onClick={() => setShowAnswer(!showAnswer)}
            style={{
              background: 'var(--gradient-card)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                {showAnswer ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                <span className="text-sm font-medium">
                  {showAnswer ? "Answer" : "Question"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                {showAnswer ? (
                  <div>
                    <p className="text-xl leading-relaxed mb-4">{currentCard.back}</p>
                    <p className="text-sm text-muted-foreground">Click to hide answer</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-medium leading-relaxed mb-4">{currentCard.front}</p>
                    <p className="text-sm text-muted-foreground">
                      Think about your answer, then click to reveal
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="max-w-2xl mx-auto">
          {showAnswer ? (
            <TooltipProvider>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                  <span>Rate how well you knew this card:</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SM2_BUTTON_CONFIG.map((config) => (
                    <Tooltip key={config.value}>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleSM2Rating(config.value)}
                          variant={config.variant}
                          className="h-auto py-3 px-4 flex flex-col items-center gap-2"
                        >
                          <span className="font-medium">{config.label}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-center max-w-xs">{config.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </TooltipProvider>
          ) : (
            <div className="flex justify-center mb-6">
              <Button 
                onClick={() => setShowAnswer(true)}
                size="lg"
                className="px-8"
              >
                <Eye className="h-4 w-4 mr-2" />
                Reveal Answer
              </Button>
            </div>
          )}

          {/* Secondary Actions */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowAnswer(!showAnswer)}
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Flip Card
            </Button>
            
            {studyCards.length === 1 && (
              <Button
                variant="outline"
                onClick={() => fetchCards()}
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh Cards
              </Button>
            )}
          </div>
        </div>

        {/* Session Summary */}
        {studyCards.length === 0 && completedCards.size > 0 && (
          <Card className="max-w-md mx-auto mt-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Session Complete!</h3>
              <p className="text-muted-foreground mb-4">
                You've completed {completedCards.size} cards in this session.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => fetchCards()} variant="outline" size="sm">
                  Check for More
                </Button>
                <Button onClick={onBackToDashboard} size="sm">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FlashcardView;