import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, Eye, EyeOff, CheckCircle2, XCircle, Clock } from "lucide-react";

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  difficulty: number;
  nextReview: Date;
}

const FlashcardView = () => {
  const [currentCard] = useState<FlashcardData>({
    id: "1",
    front: "What is the capital of France?",
    back: "Paris is the capital and most populous city of France.",
    difficulty: 1.3,
    nextReview: new Date()
  });
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress] = useState(35);
  const [cardCount] = useState({ current: 7, total: 20 });

  const handleDifficultyResponse = (quality: number) => {
    // SM2 algorithm implementation will go here
    console.log(`Response quality: ${quality}`);
    setIsFlipped(false);
    // Load next card logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Study Session</h1>
            <div className="text-sm text-muted-foreground">
              Card {cardCount.current} of {cardCount.total}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        <div className="mb-8">
          <Card 
            className={`
              relative h-80 cursor-pointer transition-all duration-500 transform
              ${isFlipped ? 'rotate-y-180' : ''}
              hover:shadow-xl border-border/50
            `}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              transformStyle: 'preserve-3d',
              background: 'var(--gradient-card)',
              boxShadow: isFlipped ? 'var(--shadow-card-hover)' : 'var(--shadow-card)'
            }}
          >
            {/* Front Side */}
            <CardContent 
              className={`
                absolute inset-0 flex items-center justify-center p-8 text-center
                ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                transition-opacity duration-300
              `}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div>
                <div className="mb-4 text-muted-foreground">
                  <Eye className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Question</p>
                </div>
                <p className="text-xl font-medium leading-relaxed">
                  {currentCard.front}
                </p>
                <p className="text-sm text-muted-foreground mt-6">
                  Click to reveal answer
                </p>
              </div>
            </CardContent>

            {/* Back Side */}
            <CardContent 
              className={`
                absolute inset-0 flex items-center justify-center p-8 text-center
                ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                transition-opacity duration-300
              `}
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div>
                <div className="mb-4 text-muted-foreground">
                  <EyeOff className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Answer</p>
                </div>
                <p className="text-lg leading-relaxed">
                  {currentCard.back}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Buttons */}
        {isFlipped && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Button
              variant="destructive"
              className="flex flex-col gap-2 h-auto p-4"
              onClick={() => handleDifficultyResponse(0)}
            >
              <XCircle className="h-6 w-6" />
              <span className="text-sm">Again</span>
              <span className="text-xs opacity-75">&lt; 1min</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto p-4 border-orange-200 text-orange-600 hover:bg-orange-50"
              onClick={() => handleDifficultyResponse(1)}
            >
              <Clock className="h-6 w-6" />
              <span className="text-sm">Hard</span>
              <span className="text-xs opacity-75">6min</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto p-4"
              onClick={() => handleDifficultyResponse(2)}
            >
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-sm">Good</span>
              <span className="text-xs opacity-75">10min</span>
            </Button>
            
            <Button
              variant="default"
              className="flex flex-col gap-2 h-auto p-4 bg-green-600 hover:bg-green-700"
              onClick={() => handleDifficultyResponse(3)}
            >
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-sm">Easy</span>
              <span className="text-xs opacity-75">4 days</span>
            </Button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Flip Card
          </Button>
        </div>

        {/* Statistics */}
        <Card className="mt-8 bg-muted/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Session Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">12</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">3</p>
                <p className="text-sm text-muted-foreground">Difficult</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">2</p>
                <p className="text-sm text-muted-foreground">Incorrect</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlashcardView;