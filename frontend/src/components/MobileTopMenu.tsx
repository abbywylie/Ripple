import { useState } from "react";
import { Menu, X, Home, Users, Calendar, Target, Bell, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Meetings", url: "/meetings", icon: Calendar },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Reminders", url: "/reminders", icon: Bell },
  { title: "Progress", url: "/progress", icon: TrendingUp },
  { title: "Profile", url: "/profile", icon: User },
];

export function MobileTopMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const handleNavigation = (url: string) => {
    navigate(url);
    setOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold">Ripple</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.url || 
                      (item.url === "/dashboard" && location.pathname === "/");
                    return (
                      <button
                        key={item.url}
                        onClick={() => handleNavigation(item.url)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

