import { useState, useEffect } from "react";
import { Home, Users, Target, Bell, TrendingUp, User, Calendar } from "lucide-react";
import rippleLogo from "@/assets/ripple-logo.png";
import { NavLink, Link } from "react-router-dom";
import { DailyRipple } from "./DailyRipple";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home, tourId: "dashboard" },
  { title: "Contacts", url: "/contacts", icon: Users, tourId: "contacts" },
  { title: "Meetings", url: "/meetings", icon: Calendar, tourId: "meetings" },
  { title: "Goals", url: "/goals", icon: Target, tourId: "goals" },
  { title: "Reminders", url: "/reminders", icon: Bell, tourId: "reminders" },
  { title: "Progress", url: "/progress", icon: TrendingUp, tourId: "progress" },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { darkMode } = useSettings();
  const [darkLogo, setDarkLogo] = useState<string | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Try to load dark mode logo
  useEffect(() => {
    if (darkMode) {
      // Try to import dark logo, fallback to regular if not found
      import("@/assets/rippleDarklogo.jpeg")
        .then((module) => {
          setDarkLogo(module.default);
          setLogoLoaded(true);
        })
        .catch(() => {
          // Dark logo doesn't exist, use regular logo with CSS adjustments
          setDarkLogo(null);
          setLogoLoaded(true);
        });
    } else {
      setDarkLogo(null);
      setLogoLoaded(true);
    }
  }, [darkMode]);

  const currentLogo = darkMode && darkLogo ? darkLogo : rippleLogo;

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarContent className="bg-sidebar pt-8 flex flex-col">
        <div className="flex-1">
          <div className="px-6 mb-8">
            <Link to="/dashboard" className="block cursor-pointer hover:opacity-80 transition-opacity">
              <img 
                src={currentLogo} 
                alt="Ripple - Waves of Opportunity" 
                className={`w-40 mx-auto transition-opacity duration-300 ${
                  darkMode && !darkLogo ? 'brightness-110 contrast-110' : ''
                }`}
              />
            </Link>
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        data-tour={item.tourId}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-6 py-3 transition-all ${
                            isActive
                              ? "text-primary bg-primary/10 border-l-2 border-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Daily Ripple Section - Fixed at bottom */}
        <DailyRipple />
      </SidebarContent>
    </Sidebar>
  );
}
