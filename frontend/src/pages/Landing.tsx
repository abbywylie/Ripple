import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, X, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BANNER_STORAGE_KEY = "ripple_live_banner_dismissed";

const Landing = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!dismissed) {
      setShowBanner(true);
      // Auto-dismiss after 12 seconds
      const timer = setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          setShowBanner(false);
          localStorage.setItem(BANNER_STORAGE_KEY, "true");
        }, 300); // Fade out duration
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsFading(true);
    setTimeout(() => {
      setShowBanner(false);
      localStorage.setItem(BANNER_STORAGE_KEY, "true");
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Live Banner */}
      {showBanner && (
        <div
          className={`relative z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 transition-opacity duration-300 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <MessageCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm md:text-base">
                <span className="font-semibold">✅ Ripple is live!</span> Ask our assistant for help with career fair follow-ups, networking emails, and more.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              Got it
              <X className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
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
    </div>
  );
};

export default Landing;
