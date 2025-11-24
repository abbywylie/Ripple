import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface FeatureUnlock {
  feature: string;
  unlocked: boolean;
  requiredLevel: ExperienceLevel;
  unlockMessage?: string;
}

/**
 * Hook to check if features are unlocked based on user's experience level
 */
export const useFeatureUnlock = () => {
  const { user } = useAuth();
  const experienceLevel = (user?.experience_level || "beginner") as ExperienceLevel;

  const isFeatureUnlocked = (requiredLevel: ExperienceLevel): boolean => {
    const levels: ExperienceLevel[] = ["beginner", "intermediate", "advanced"];
    const userLevelIndex = levels.indexOf(experienceLevel);
    const requiredLevelIndex = levels.indexOf(requiredLevel);
    return userLevelIndex >= requiredLevelIndex;
  };

  const features = useMemo(() => {
    return {
      // Beginner features (always unlocked)
      basicContacts: true,
      basicGoals: true,
      basicReminders: true,
      emailTemplates: true,
      dashboardOverview: true,

      // Intermediate features
      calendarSync: isFeatureUnlocked("intermediate"),
      goalStatistics: isFeatureUnlocked("intermediate"),
      templateCustomization: isFeatureUnlocked("intermediate"),
      pluginIntegration: isFeatureUnlocked("intermediate"),
      relationshipHealth: isFeatureUnlocked("intermediate"),

      // Advanced features
      fullAnalytics: isFeatureUnlocked("advanced"),
      aiSuggestedActions: isFeatureUnlocked("advanced"),
      cadenceBuilder: isFeatureUnlocked("advanced"),
      uploadableNotes: isFeatureUnlocked("advanced"),
      advancedTemplateBuilder: isFeatureUnlocked("advanced"),
      fullKnowledgeBase: isFeatureUnlocked("advanced"),
    };
  }, [experienceLevel]);

  return {
    experienceLevel,
    features,
    isFeatureUnlocked,
  };
};

