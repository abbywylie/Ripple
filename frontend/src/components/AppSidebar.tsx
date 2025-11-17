import { Home, Users, Target, Bell, TrendingUp, User, Calendar } from "lucide-react";
import rippleLogo from "@/assets/ripple-logo.png";
import { NavLink, Link } from "react-router-dom";
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
  return (
    <Sidebar className="border-r border-border/50">
      <SidebarContent className="bg-sidebar pt-8">
        <div className="px-6 mb-8">
          <Link to="/dashboard" className="block cursor-pointer hover:opacity-80 transition-opacity">
            <img src={rippleLogo} alt="Ripple - Waves of Opportunity" className="w-40 mx-auto" />
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
      </SidebarContent>
    </Sidebar>
  );
}
