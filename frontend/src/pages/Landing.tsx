import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-50 animate-glow-pulse" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">Coming Soon</span>
        </div>

        <h1 className="text-7xl md:text-8xl font-bold mb-6 gradient-text">
          Ripple
        </h1>
        
        <p className="text-2xl md:text-3xl text-muted-foreground mb-4">
          Professional Networking Reimagined
        </p>
        
        <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto">
          Build meaningful connections, track your relationships, and grow your network with purpose.
        </p>

        <div className="flex gap-4 justify-center">
          <Link to="/login">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 transition-all"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="glass-card p-6 rounded-xl">
            <div className="text-3xl font-bold text-primary mb-2">42</div>
            <div className="text-sm text-muted-foreground">Connections</div>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <div className="text-3xl font-bold text-accent mb-2">5</div>
            <div className="text-sm text-muted-foreground">Active Goals</div>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <div className="text-3xl font-bold text-primary mb-2">87%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
