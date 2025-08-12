import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminAuthPageProps {
  onBack: () => void;
  onAuthSuccess: () => void;
}

const AdminAuthPage = ({ onBack, onAuthSuccess }: AdminAuthPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const { toast } = useToast();

  // Form states for Supabase auth
  const [authData, setAuthData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    // Check if user is already authenticated with Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authData.email,
        password: authData.password,
      });

      if (error) throw error;

      toast({
        title: "Authentication Successful",
        description: "You are now logged in. Please enter the admin password.",
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Simple admin password check (in a real app, this would be more secure)
    if (adminPassword === "admin123") {
      onAuthSuccess();
    } else {
      setError("Invalid admin password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Admin Access</h1>
            </div>
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Auth Form */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Admin Dashboard Access</h2>
            <p className="text-muted-foreground">
              {!isAuthenticated 
                ? "Please sign in with your account first" 
                : "Enter admin password to continue"
              }
            </p>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {!isAuthenticated ? "Step 1: User Authentication" : "Step 2: Admin Verification"}
              </CardTitle>
              <CardDescription>
                {!isAuthenticated 
                  ? "Sign in with your regular account credentials"
                  : "Verify admin access with password"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isAuthenticated ? (
                /* Supabase Authentication Form */
                <form onSubmit={handleSupabaseAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={authData.email}
                        onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={authData.password}
                        onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              ) : (
                /* Admin Password Form */
                <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-password">Admin Password</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter admin password"
                        className="pl-10"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Access Admin Dashboard
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Demo password: admin123
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          {isAuthenticated && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300 text-center">
                ✓ User authentication successful
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminAuthPage;