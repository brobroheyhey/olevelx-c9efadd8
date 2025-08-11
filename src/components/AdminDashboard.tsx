import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, BookOpen, BarChart3, Eye } from "lucide-react";

const AdminDashboard = () => {
  const [decks] = useState([
    { id: "1", name: "Geography Basics", cardCount: 45, activeStudents: 12, created: "2024-01-15" },
    { id: "2", name: "Math Fundamentals", cardCount: 32, activeStudents: 8, created: "2024-01-10" },
    { id: "3", name: "Science Vocabulary", cardCount: 67, activeStudents: 15, created: "2024-01-08" },
  ]);

  const [cards] = useState([
    { id: "1", front: "What is the capital of France?", back: "Paris", deckId: "1" },
    { id: "2", front: "What is 2 + 2?", back: "4", deckId: "2" },
    { id: "3", front: "What is photosynthesis?", back: "The process by which plants make food", deckId: "3" },
  ]);

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
              <Button variant="outline" size="sm">Logout</Button>
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
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Deck
              </Button>
            </div>

            <div className="grid gap-4">
              {decks.map((deck) => (
                <Card key={deck.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{deck.name}</CardTitle>
                        <CardDescription>
                          Created on {new Date(deck.created).toLocaleDateString()}
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
                    <select id="deck-select" className="w-full p-2 border rounded-md bg-background">
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-back">Back (Answer)</Label>
                    <Textarea 
                      id="card-back" 
                      placeholder="Enter the answer or explanation..."
                      className="min-h-20"
                    />
                  </div>
                  <Button className="w-full">
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
                  <div className="space-y-3">
                    {cards.map((card) => (
                      <div key={card.id} className="p-3 border rounded-lg bg-muted/20">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm">{card.front}</p>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{card.back}</p>
                      </div>
                    ))}
                  </div>
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
