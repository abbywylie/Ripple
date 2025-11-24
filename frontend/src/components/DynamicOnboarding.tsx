import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { ExperienceLevelSelection } from "./ExperienceLevelSelection";
import { BeginnerOnboarding } from "./onboarding/BeginnerOnboarding";
import { IntermediateOnboarding } from "./onboarding/IntermediateOnboarding";
import { ExperiencedOnboarding } from "./onboarding/ExperiencedOnboarding";
import { authApi } from "@/lib/api";

type ExperienceLevel = "beginner" | "intermediate" | "experienced";

export const DynamicOnboarding = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showExperienceSelection, setShowExperienceSelection] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);

  useEffect(() => {
    // Only show onboarding on protected routes (not login/register)
    const isProtectedRoute = !["/login", "/register", "/"].includes(location.pathname);
    
    if (!user?.userId || !isProtectedRoute) {
      return;
    }

    // If user hasn't completed onboarding and doesn't have experience level
    if (!user.onboarding_completed && !user.experience_level) {
      setShowExperienceSelection(true);
    }
    // If user has experience level but hasn't completed onboarding
    else if (!user.onboarding_completed && user.experience_level) {
      setExperienceLevel(user.experience_level as ExperienceLevel);
      setShowOnboarding(true);
    }
  }, [user, location.pathname]);

  const handleExperienceSelected = (level: ExperienceLevel) => {
    setExperienceLevel(level);
    setShowExperienceSelection(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    // Refresh user data to get updated onboarding_completed status
    try {
      const userData = await authApi.getMe();
      // Force a re-render by updating the user context
      window.location.reload(); // Simple way to refresh user state
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  if (showExperienceSelection) {
    return <ExperienceLevelSelection open={true} onComplete={handleExperienceSelected} />;
  }

  if (showOnboarding && experienceLevel) {
    switch (experienceLevel) {
      case "beginner":
        return <BeginnerOnboarding open={true} onComplete={handleOnboardingComplete} />;
      case "intermediate":
        return <IntermediateOnboarding open={true} onComplete={handleOnboardingComplete} />;
      case "experienced":
        return <ExperiencedOnboarding open={true} onComplete={handleOnboardingComplete} />;
      default:
        return null;
    }
  }

  return null;
};

