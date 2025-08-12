import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, BookOpen, BarChart3, Eye, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import CSVUploadDialog from "./CSVUploadDialog";

const AdminDashboard = ({ onLogout }: { onLogout?: () => void }) => {
  const [decks, setDecks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleLogout = () => {
    onLogout?.();
  };

  const fetchDecks = async () => {
    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        console.error('No authenticated user found');
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to view decks",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('decks')
        .select(`
          *,
          cards(count)
        `)
        .order('created_at', { ascending: false });

      console.log('Decks query result:', { data, error });

      if (error) {
        console.error('Error fetching decks:', error);
        toast({
          title: "Error",
          description: `Failed to fetch decks: ${error.message}`,
          variant: "destructive",
        });
        throw error;
      }

      const decksWithCardCount = data?.map(deck => ({
        ...deck,
        cardCount: deck.cards?.[0]?.count || 0
      })) || [];

      console.log('Processed decks:', decksWithCardCount);
      setDecks(decksWithCardCount);
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchCards = async (deckId: string) => {
    if (!deckId) {
      setCards([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cards",
        variant: "destructive",
      });
    }
  };

  const handleDeckChange = (deckId: string) => {
    setSelectedDeckId(deckId);
    fetchCards(deckId);
  };

  const handleAddCard = async () => {
    if (!selectedDeckId || !cardFront.trim() || !cardBack.trim()) {
      toast({
        title: "Error",
        description: "Please select a deck and fill in both front and back",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cards')
        .insert({
          deck_id: selectedDeckId,
          front: cardFront.trim(),
          back: cardBack.trim(),
        });

      if (error) throw error;

      setCardFront("");
      setCardBack("");
      fetchCards(selectedDeckId);
      toast({
        title: "Success",
        description: "Card added successfully",
      });
    } catch (error) {
      console.error('Error adding card:', error);
      toast({
        title: "Error",
        description: "Failed to add card",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      fetchCards(selectedDeckId);
      toast({
        title: "Success",
        description: "Card deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Error",
        description: "Failed to delete card",
        variant: "destructive",
      });
    }
  };

  const handleCSVUploadSuccess = () => {
    fetchDecks(); // Refresh the deck list
  };

  const [students] = useState([
    { id: "1", name: "John Smith", email: "john@example.com", decksStudied: 3, totalCards: 144 },
    { id: "2", name: "Sarah Johnson", email: "sarah@example.com", decksStudied: 2, totalCards: 77 },
    { id: "3", name: "Mike Wilson", email: "mike@example.com", decksStudied: 1, totalCards: 45 },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                Admin Portal
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+12 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">+89 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,341</div>
              <p className="text-xs text-muted-foreground">+234 from last week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="decks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="decks">Deck Management</TabsTrigger>
            <TabsTrigger value="cards">Card Editor</TabsTrigger>
            <TabsTrigger value="students">Student Overview</TabsTrigger>
          </TabsList>

          {/* Deck Management */}
          <TabsContent value="decks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Decks</h2>
              <div className="flex gap-2">
                <CSVUploadDialog 
                  trigger={
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload CSV
                    </Button>
                  }
                  onSuccess={handleCSVUploadSuccess}
                />
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Deck
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {decks.map((deck) => (
                <Card key={deck.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{deck.name}</CardTitle>
                        <CardDescription>
                          Created on {new Date(deck.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                      <span>{deck.cardCount} cards</span>
                      <span>{deck.activeStudents} active students</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Card Editor */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Add New Card Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Card</CardTitle>
                  <CardDescription>Create a new flashcard for your deck</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="deck-select">Select Deck</Label>
                    <select 
                      id="deck-select" 
                      className="w-full p-2 border rounded-md bg-background"
                      value={selectedDeckId}
                      onChange={(e) => handleDeckChange(e.target.value)}
                    >
                      <option value="">Choose a deck...</option>
                      {decks.map((deck) => (
                        <option key={deck.id} value={deck.id}>{deck.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="card-front">Front (Question)</Label>
                    <Textarea 
                      id="card-front" 
                      placeholder="Enter the question or prompt..."
                      className="min-h-20"
                      value={cardFront}
                      onChange={(e) => setCardFront(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-back">Back (Answer)</Label>
                    <Textarea 
                      id="card-back" 
                      placeholder="Enter the answer or explanation..."
                      className="min-h-20"
                      value={cardBack}
                      onChange={(e) => setCardBack(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddCard}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Cards */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Cards</CardTitle>
                  <CardDescription>Manage your flashcards</CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedDeckId ? (
                    <p className="text-center text-muted-foreground py-8">
                      Select a deck to view and manage cards
                    </p>
                  ) : cards.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No cards found in this deck
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cards.map((card) => (
                        <div key={card.id} className="p-3 border rounded-lg bg-muted/20">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm">{card.front}</p>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteCard(card.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{card.back}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Student Overview */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Student Progress</h2>
              <div className="flex gap-2">
                <Input placeholder="Search students..." className="w-64" />
                <Button variant="outline">Export Data</Button>
              </div>
            </div>

            <div className="grid gap-4">
              {students.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{student.decksStudied} Decks Studied</p>
                        <p className="text-sm text-muted-foreground">{student.totalCards} Cards Reviewed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
