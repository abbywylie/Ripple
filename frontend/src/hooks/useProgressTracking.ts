import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { contactsApi, goalsApi, interactionsApi, meetingsApi } from "@/lib/api";

export interface ProgressChecklist {
  id: string;
  label: string;
  completed: boolean;
}

export interface LevelProgress {
  level: "beginner" | "intermediate" | "advanced";
  completed: number;
  total: number;
  checklist: ProgressChecklist[];
  canUnlockNext: boolean;
}

/**
 * Hook to track user progress for level unlocking
 */
export const useProgressTracking = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LevelProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    const checkProgress = async () => {
      try {
        const [contacts, goals, interactions, meetings] = await Promise.all([
          contactsApi.getContacts(user.userId),
          goalsApi.getGoals(user.userId),
          interactionsApi.getInteractionsForUser(user.userId),
          meetingsApi.getUserMeetings(user.userId),
        ]);

        const contactsList = Array.isArray(contacts) ? contacts : [];
        const goalsList = Array.isArray(goals) ? goals : [];
        const interactionsList = Array.isArray(interactions) ? interactions : [];
        const meetingsList = Array.isArray(meetings) ? meetings : [];

        const experienceLevel = (user.experience_level || "beginner") as "beginner" | "intermediate" | "advanced";

        if (experienceLevel === "beginner") {
          // Beginner: Complete 3 out of 5 basic actions
          const checklist: ProgressChecklist[] = [
            {
              id: "add-contact",
              label: "Add your first contact",
              completed: contactsList.length > 0,
            },
            {
              id: "create-goal",
              label: "Create your first goal",
              completed: goalsList.length > 0,
            },
            {
              id: "set-reminder",
              label: "Set a follow-up reminder",
              completed: contactsList.some((c: any) => c.date_next_follow_up),
            },
            {
              id: "use-template",
              label: "Use an email template",
              completed: interactionsList.length > 0, // Simplified: any interaction counts
            },
            {
              id: "view-dashboard",
              label: "View your dashboard",
              completed: true, // Always true if they're seeing this
            },
          ];

          const completed = checklist.filter((item) => item.completed).length;
          const canUnlockNext = completed >= 3;

          setProgress({
            level: "beginner",
            completed,
            total: 5,
            checklist,
            canUnlockNext,
          });
        } else if (experienceLevel === "intermediate") {
          // Intermediate: Complete 3 informational interviews OR use plugin to auto-log 5 interactions
          const informationalInterviews = meetingsList.filter(
            (m: any) => m.meeting_type?.toLowerCase().includes("informational") || m.meeting_type?.toLowerCase().includes("info")
          ).length;

          const autoLoggedInteractions = interactionsList.filter(
            (i: any) => i.source === "plugin" || i.source === "auto"
          ).length;

          const checklist: ProgressChecklist[] = [
            {
              id: "info-interviews",
              label: "Complete 3 informational interviews",
              completed: informationalInterviews >= 3,
            },
            {
              id: "auto-log",
              label: "Use plugin to auto-log 5 interactions",
              completed: autoLoggedInteractions >= 5,
            },
          ];

          const completed = checklist.filter((item) => item.completed).length;
          const canUnlockNext = completed >= 1; // Either one unlocks advanced

          setProgress({
            level: "intermediate",
            completed,
            total: 2,
            checklist,
            canUnlockNext,
          });
        } else {
          // Advanced: No unlock criteria (already at max level)
          setProgress({
            level: "advanced",
            completed: 0,
            total: 0,
            checklist: [],
            canUnlockNext: false,
          });
        }
      } catch (error) {
        console.error("Failed to check progress:", error);
      } finally {
        setLoading(false);
      }
    };

    checkProgress();
  }, [user]);

  return { progress, loading };
};

