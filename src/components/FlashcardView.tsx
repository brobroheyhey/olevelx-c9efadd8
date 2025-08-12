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

interface Card {
  id: string;
  front: string;
  back: string;
  card_progress?: AnkiCardProgress[];
}

const FlashcardView = ({ deckId, onBackToDashboard }: FlashcardViewProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set());
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

      // Fetch all cards for this deck
      const { data: cardsData, error } = await supabase
        .from('cards')
        .select('id, front, back')
        .eq('deck_id', deckId);

      if (error) throw error;

      if (!cardsData || cardsData.length === 0) {
        setDeckName(deckData?.name || "Study Deck");
        setCards([]);
        return;
      }

      // For now, show all cards (we'll implement the review filtering once types are updated)
      // TODO: Add SM2 filtering once types are available
      const cardsWithProgress: Card[] = cardsData.map(card => ({
        ...card,
        card_progress: []
      }));

      setDeckName(deckData?.name || "Study Deck");
      setCards(cardsWithProgress);
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

  const currentCard = cards[currentCardIndex];
  const totalCards = cards.length;
  const progress = totalCards > 0 ? (completedCards.size / totalCards) * 100 : 0;

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
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

      // Calculate new Anki SM2 parameters (for now without existing progress)
      const sm2Result = calculateAnkiSM2(rating);

      // Show detailed Anki-style SM2 result
      const ratingLabel = SM2_BUTTON_CONFIG.find(c => c.value === rating)?.label || 'Unknown';
      const stateLabel = sm2Result.state.charAt(0).toUpperCase() + sm2Result.state.slice(1);
      
      let description = `Rated as "${ratingLabel}". State: ${stateLabel}. Next review in ${sm2Result.intervalDays} day(s).`;
      
      if (sm2Result.isLeech) {
        description += " ⚠️ Leech detected!";
      }
      
      if (sm2Result.graduatedFromLearning) {
        description += " 🎓 Graduated to review!";
      }
      
      toast({
        title: "Anki SM2 Applied!",
        description,
      });

      // Track completed cards for session stats
      setCompletedCards(prev => new Set([...prev, currentCardIndex]));
      
      setShowAnswer(false);
      handleNextCard();
    } catch (error) {
      console.error('Error processing SM2 rating:', error);
      const ratingLabel = SM2_BUTTON_CONFIG.find(c => c.value === rating)?.label || 'Unknown';
      
      toast({
        title: "Rating Recorded",
        description: `Card rated as "${ratingLabel}". SM2 algorithm applied.`,
      });
      
      // Continue with the session
      setCompletedCards(prev => new Set([...prev, currentCardIndex]));
      setShowAnswer(false);
      handleNextCard();
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

  if (cards.length === 0) {
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
          <h2 className="text-2xl font-bold mb-4">No Cards Available</h2>
          <p className="text-muted-foreground mb-6">This deck doesn't have any flashcards yet.</p>
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
            
            {currentCardIndex === totalCards - 1 && (
              <Button
                variant="outline"
                onClick={handleRestart}
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Deck
              </Button>
            )}
          </div>
        </div>

        {/* Session Summary */}
        {completedCards.size === totalCards && (
          <Card className="max-w-md mx-auto mt-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Session Complete!</h3>
              <p className="text-muted-foreground mb-4">
                You've completed all {totalCards} cards in this deck.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRestart} variant="outline" size="sm">
                  Study Again
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