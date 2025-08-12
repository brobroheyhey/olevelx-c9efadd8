import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CSVUploadDialogProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

const CSVUploadDialog = ({ trigger, onSuccess }: CSVUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deckName, setDeckName] = useState("");
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (csvText: string): { front: string; back: string }[] => {
    const lines = csvText.trim().split('\n');
    const cards: { front: string; back: string }[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Simple CSV parsing - handles quoted values
      const parts = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      
      if (parts.length >= 2) {
        // Remove surrounding quotes if they exist
        const front = parts[0].replace(/^"(.*)"$/, '$1');
        const back = parts[1].replace(/^"(.*)"$/, '$1');
        
        if (front && back) {
          cards.push({ front, back });
        }
      }
    }
    
    return cards;
  };

  const handleUpload = async () => {
    if (!file || !deckName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a deck name and select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to upload flashcards.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Read and parse CSV file
      const csvText = await file.text();
      const cards = parseCSV(csvText);
      
      if (cards.length === 0) {
        toast({
          title: "No valid cards found",
          description: "Please check your CSV format. Each row should have Front,Back format.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Create deck in database
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert({
          name: deckName.trim(),
          created_by: user.id,
          is_public: false
        })
        .select()
        .single();

      if (deckError) {
        throw deckError;
      }

      // Create cards in database
      const cardsToInsert = cards.map(card => ({
        deck_id: deck.id,
        front: card.front,
        back: card.back
      }));

      const { error: cardsError } = await supabase
        .from('cards')
        .insert(cardsToInsert);

      if (cardsError) {
        throw cardsError;
      }

      setIsUploading(false);
      toast({
        title: "Success!",
        description: `Deck "${deckName}" created with ${cards.length} cards.`,
      });
      
      // Reset form and close dialog
      setFile(null);
      setDeckName("");
      onSuccess?.();
      
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Flashcards from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with flashcard data. Format: Front,Back (one card per row)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="deck-name">Deck Name</Label>
            <Input
              id="deck-name"
              placeholder="Enter deck name..."
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="csv-file">CSV File</Label>
            <div className="mt-1">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{file.name}</span>
                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
            <strong>CSV Format:</strong><br />
            Front,Back<br />
            "What is the capital of France?","Paris"<br />
            "What is 2+2?","4"
          </div>
          
          <Button 
            onClick={handleUpload} 
            disabled={!file || !deckName.trim() || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Create Deck from CSV
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVUploadDialog;