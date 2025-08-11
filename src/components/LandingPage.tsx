import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BarChart3, Clock } from "lucide-react";
const LandingPage = () => {
  return <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">OLevelX</h1>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost">Student Login</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Master Any Subject with
            <span className="block text-primary">Smart Flashcards</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">Experience the power of spaced repetition with our intelligent flashcard system. Learn faster, remember longer, and track your progress with scientific precision.</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="px-8 py-3 text-lg">
              Start Learning
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose OLevelX?</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-border/50">
            <CardHeader className="text-center">
              <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <CardTitle>Smart Algorithm</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Our SM2 algorithm adapts to your learning pace, showing cards when you need them most.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-border/50">
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Visualize your learning journey with detailed statistics and progress charts.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-border/50">
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <CardTitle>Spaced Repetition</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Learn efficiently with scientifically proven spaced repetition intervals.
              </CardDescription>
            </CardContent>
          </Card>

          
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto text-center p-8 bg-gradient-to-br from-primary/5 to-accent/20">
          <CardHeader>
            <CardTitle className="text-3xl mb-4">Ready to Transform Your Learning?</CardTitle>
            <CardDescription className="text-lg">
              Join thousands of students already using OLevelX to achieve their academic goals.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button size="lg" className="px-12 py-3 text-lg">
              Get Started Now
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 OLevelX. Built with intelligence and precision.</p>
            <div className="mt-4">
              <Button variant="ghost" size="sm" className="text-xs opacity-50 hover:opacity-80">
                Admin Access
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;