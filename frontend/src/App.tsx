import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import Meetings from "./pages/Meetings";
import Goals from "./pages/Goals";
import Reminders from "./pages/Reminders";
import ProgressPage from "./pages/Progress";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import RAGAssistant from "./components/RAGAssistant";
import { OnboardingTour } from "./components/OnboardingTour";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";

// Helper to get efficient loading setting from localStorage
const getEfficientLoadingSetting = (): boolean => {
  const saved = localStorage.getItem('ripple_ui_settings');
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      return settings.efficientLoading ?? false;
    } catch {
      return false;
    }
  }
  return false;
};

// Create query client with efficient loading support
const createQueryClient = (efficientLoading?: boolean) => {
  const isEfficient = efficientLoading ?? getEfficientLoadingSetting();
  
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Reduce background refreshes when efficient loading is enabled
        refetchOnWindowFocus: !isEfficient,
        refetchOnReconnect: !isEfficient,
        refetchOnMount: true, // Still refetch on mount for fresh data
        staleTime: isEfficient ? 5 * 60 * 1000 : 0, // 5 minutes when efficient, 0 otherwise
      },
    },
  });
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
      <RAGAssistant />
      <OnboardingTour />
    </div>
  </SidebarProvider>
);

const AppContent = () => {
  const { efficientLoading } = useSettings();
  const [queryClient] = useState(() => createQueryClient());

  // Update query client when efficient loading changes
  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        refetchOnWindowFocus: !efficientLoading,
        refetchOnReconnect: !efficientLoading,
        staleTime: efficientLoading ? 5 * 60 * 1000 : 0,
      },
    });
  }, [efficientLoading, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><AppLayout><Contacts /></AppLayout></ProtectedRoute>} />
            <Route path="/contacts/:contactId" element={<ProtectedRoute><AppLayout><ContactDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/meetings" element={<ProtectedRoute><AppLayout><Meetings /></AppLayout></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><AppLayout><Goals /></AppLayout></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><AppLayout><Reminders /></AppLayout></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><AppLayout><ProgressPage /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const App = () => (
  <SettingsProvider>
    <AppContent />
  </SettingsProvider>
);

export default App;
