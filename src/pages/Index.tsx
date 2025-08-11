import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import FlashcardView from "@/components/FlashcardView";
import AdminDashboard from "@/components/AdminDashboard";
import AuthPage from "@/components/AuthPage";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [currentView, setCurrentView] = useState<"landing" | "flashcard" | "admin" | "auth" | "dashboard">("landing");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Temporary navigation for demo purposes
  const handleNavigation = (view: "landing" | "flashcard" | "admin" | "auth" | "dashboard") => {
    setCurrentView(view);
  };

  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setCurrentView("flashcard");
  };
  // Demo navigation overlay
  const DemoNavigation = () => (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <button 
        onClick={() => handleNavigation("landing")}
        className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-80"
      >
        Landing
      </button>
      <button 
        onClick={() => handleNavigation("flashcard")}
        className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-80"
      >
        Flashcards
      </button>
      <button 
        onClick={() => handleNavigation("admin")}
        className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-80"
      >
        Admin
      </button>
      <button 
        onClick={() => handleNavigation("dashboard")}
        className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-80"
      >
        Dashboard
      </button>
    </div>
  );

  return (
    <>
      <DemoNavigation />
      {currentView === "landing" && <LandingPage onNavigateToAuth={() => handleNavigation("auth")} />}
      {currentView === "flashcard" && (
        <FlashcardView 
          deckId={selectedDeckId} 
          onBackToDashboard={() => handleNavigation("dashboard")} 
        />
      )}
      {currentView === "admin" && <AdminDashboard />}
      {currentView === "dashboard" && (
        <Dashboard 
          onSelectDeck={handleSelectDeck}
          onLogout={() => handleNavigation("landing")}
        />
      )}
      {currentView === "auth" && (
        <AuthPage 
          onBack={() => handleNavigation("landing")} 
          onAuthSuccess={() => handleNavigation("dashboard")}
        />
      )}
    </>
  );
};

export default Index;
