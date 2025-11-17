import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, X, MessageCircle, Users, Target, TrendingUp, Calendar, Bot, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import rippleLogo from "@/assets/ripple-logo.png";
import { statsApi } from "@/lib/api";

const BANNER_STORAGE_KEY = "ripple_live_banner_dismissed";

const Landing = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [stats, setStats] = useState({
    total_users: 0,
    total_contacts: 0,
    active_users: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

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

  // Fetch platform stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        // Keep default values on error
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const handleDismiss = () => {
    setIsFading(true);
    setTimeout(() => {
      setShowBanner(false);
      localStorage.setItem(BANNER_STORAGE_KEY, "true");
    }, 300);
  };

  const features = [
    {
      icon: Users,
      title: "Smart Contact Management",
      description: "Organize and track all your professional connections in one place. Never lose touch with important contacts.",
    },
    {
      icon: Calendar,
      title: "Automated Follow-ups",
      description: "Set reminders and never miss a follow-up. Build stronger relationships with timely, meaningful outreach.",
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set networking goals and track your progress. Turn intentions into actionable achievements.",
    },
    {
      icon: Bot,
      title: "AI-Powered Assistant",
      description: "Get personalized advice on networking emails, follow-ups, and relationship building from our AI assistant.",
    },
    {
      icon: TrendingUp,
      title: "Progress Analytics",
      description: "Visualize your network growth and relationship strength over time with insightful analytics.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is secure and private. We respect your connections and never share your information.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
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

      {/* Header with Login */}
      <header className="relative z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src={rippleLogo} alt="Ripple" className="h-8 w-auto" />
              <span className="text-xl font-bold gradient-text">Ripple</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="hidden sm:flex">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary/90">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center py-20 px-4 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Made for Students by Students</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 gradient-text">
            Build Your Network
            <br />
            <span className="text-foreground">With Purpose</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Transform how you connect, follow up, and grow your professional relationships.
          </p>
          
          <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto">
            Track contacts, automate follow-ups, set goals, and get AI-powered advice—all in one powerful platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/register">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 transition-all"
              >
                Start Building Your Network
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-6 text-lg rounded-xl border-2"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="glass-card p-6 rounded-xl border-border/50">
              <div className="text-4xl font-bold text-primary mb-2">
                {statsLoading ? (
                  <span className="text-2xl">...</span>
                ) : (
                  <>
                    {stats.active_users > 0 ? formatNumber(stats.active_users) : stats.total_users}
                    {stats.active_users > 0 && stats.active_users < 1000 ? "" : "+"}
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.active_users > 0 ? "Active Users" : "Total Users"}
              </div>
            </div>
            <div className="glass-card p-6 rounded-xl border-border/50">
              <div className="text-4xl font-bold text-accent mb-2">
                {statsLoading ? (
                  <span className="text-2xl">...</span>
                ) : (
                  <>
                    {formatNumber(stats.total_contacts)}
                    {stats.total_contacts >= 1000 ? "+" : ""}
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Connections Tracked</div>
            </div>
            <div className="glass-card p-6 rounded-xl border-border/50">
              <div className="text-4xl font-bold text-primary mb-2">
                {statsLoading ? (
                  <span className="text-2xl">...</span>
                ) : (
                  <>
                    {stats.total_users > 0 ? formatNumber(stats.total_users) : "0"}
                    {stats.total_users >= 1000 ? "+" : ""}
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <br />
              <span className="gradient-text">Grow Your Network</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to help you build meaningful professional relationships
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="glass-card p-6 rounded-xl border-border/50 hover:border-primary/50 transition-all group hover:shadow-lg"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 rounded-2xl border-border/50 bg-gradient-to-br from-primary/10 to-accent/10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Transform Your Networking?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who are building stronger networks with Ripple.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/50"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-6 text-lg rounded-xl border-2"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={rippleLogo} alt="Ripple" className="h-6 w-auto" />
            <span className="text-sm text-muted-foreground">© 2025 Ripple. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">
              Login
            </Link>
            <Link to="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
