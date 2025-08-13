import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import FlashcardView from "@/components/FlashcardView";
import AdminDashboard from "@/components/AdminDashboard";
import AdminAuthPage from "@/components/AdminAuthPage";
import AuthPage from "@/components/AuthPage";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  console.log("Index component is loading...");
  const [currentView, setCurrentView] = useState<"landing" | "flashcard" | "admin" | "admin-auth" | "auth" | "dashboard">("landing");
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  
  console.log("Current view:", currentView);

  // Temporary navigation for demo purposes
  const handleNavigation = (view: "landing" | "flashcard" | "admin" | "admin-auth" | "auth" | "dashboard") => {
    setCurrentView(view);
  };

  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setCurrentView("flashcard");
  };

  return (
    <>
      {currentView === "landing" && (
        <LandingPage 
          onNavigateToAuth={() => handleNavigation("auth")} 
          onNavigateToAdmin={() => handleNavigation("admin-auth")}
        />
      )}
      {currentView === "flashcard" && (
        <FlashcardView 
          deckId={selectedDeckId} 
          onBackToDashboard={() => handleNavigation("dashboard")} 
        />
      )}
      {currentView === "admin-auth" && (
        <AdminAuthPage 
          onBack={() => handleNavigation("landing")} 
          onAuthSuccess={() => handleNavigation("admin")}
        />
      )}
      {currentView === "admin" && <AdminDashboard onLogout={() => handleNavigation("landing")} />}
      {currentView === "dashboard" && (
        <Dashboard 
          onSelectDeck={handleSelectDeck}
          onLogout={() => handleNavigation("landing")}
          onAdminAccess={() => handleNavigation("admin")}
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
