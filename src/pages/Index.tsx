import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import FlashcardView from "@/components/FlashcardView";
import AdminDashboard from "@/components/AdminDashboard";

const Index = () => {
  const [currentView, setCurrentView] = useState<"landing" | "flashcard" | "admin">("landing");

  // Temporary navigation for demo purposes
  const handleNavigation = (view: "landing" | "flashcard" | "admin") => {
    setCurrentView(view);
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
    </div>
  );

  return (
    <>
      <DemoNavigation />
      {currentView === "landing" && <LandingPage />}
      {currentView === "flashcard" && <FlashcardView />}
      {currentView === "admin" && <AdminDashboard />}
    </>
  );
};

export default Index;
