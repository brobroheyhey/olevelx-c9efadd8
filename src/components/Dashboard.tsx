import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User, LogOut, BookOpen, Clock, BarChart3, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isAdmin } from "@/utils/adminUtils";

interface Deck {
  id: string;
  name: string;
  description: string;
  card_count?: number;
}

interface DashboardProps {
  onSelectDeck: (deckId: string) => void;
  onLogout: () => void;
  onAdminAccess?: () => void;
}

const Dashboard = ({ onSelectDeck, onLogout, onAdminAccess }: DashboardProps) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
    fetchDecks();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single();
        
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchDecks = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch both public decks and user's own decks
      const { data, error } = await supabase
        .from('decks')
        .select(`
          id,
          name,
          description,
          is_public
        `)
        .or(`is_public.eq.true${user ? `,created_by.eq.${user.id}` : ''}`);

      if (error) throw error;

      // Get card counts for each deck
      const decksWithCount = await Promise.all(
        (data || []).map(async (deck) => {
          const { count } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .eq('deck_id', deck.id);
          
          return {
            ...deck,
            card_count: count || 0
          };
        })
      );

      setDecks(decksWithCount);
    } catch (error) {
      console.error('Error fetching decks:', error);
      toast({
        title: "Error",
        description: "Failed to load decks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">OLevelX</h1>
            </div>
            <div className="flex items-center gap-4">
              {userProfile && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Welcome, {userProfile.name}</span>
                </div>
              )}
              {userProfile && isAdmin(userProfile.email) && onAdminAccess && (
                <Button variant="outline" size="sm" onClick={onAdminAccess}>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Your Learning Dashboard</h2>
          <p className="text-muted-foreground text-lg">
            Choose a deck to start practicing with flashcards
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Decks</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{decks.length}</div>
              <p className="text-xs text-muted-foreground">Ready to study</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {decks.reduce((total, deck) => total + (deck.card_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all decks</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0h</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Decks Grid */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Available Study Decks</h3>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-10 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <Card key={deck.id} className="hover:shadow-lg transition-all duration-300 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {deck.name}
                    </CardTitle>
                    <CardDescription>
                      {deck.description || "Practice flashcards for this subject"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">
                        {deck.card_count || 0} cards
                      </span>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => onSelectDeck(deck.id)}
                    >
                      Start Studying
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && decks.length === 0 && (
            <Card className="p-8 text-center">
              <CardContent>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No study decks available yet</h3>
                <p className="text-muted-foreground">
                  Your teacher will add study materials soon. Check back later!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;