import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, GraduationCap, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

type ExperienceLevel = "beginner" | "intermediate" | "experienced";

interface ExperienceLevelSelectionProps {
  open: boolean;
  onComplete: (level: ExperienceLevel) => void;
}

export const ExperienceLevelSelection = ({ open, onComplete }: ExperienceLevelSelectionProps) => {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (level: ExperienceLevel) => {
    setSelectedLevel(level);
    setIsSaving(true);
    
    try {
      await authApi.updateProfile({ experience_level: level });
      toast.success("Experience level saved!");
      onComplete(level);
    } catch (error: any) {
      toast.error("Failed to save experience level");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const options = [
    {
      level: "beginner" as ExperienceLevel,
      title: "I'm new to networking",
      subtitle: "Need guidance",
      icon: GraduationCap,
      description: "I want step-by-step help learning how to network effectively",
      color: "bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100",
    },
    {
      level: "intermediate" as ExperienceLevel,
      title: "I know the basics",
      subtitle: "Need reminders and templates",
      icon: TrendingUp,
      description: "I understand networking but need tools to stay organized",
      color: "bg-green-50 border-green-200 text-green-900 hover:bg-green-100",
    },
    {
      level: "experienced" as ExperienceLevel,
      title: "I'm experienced",
      subtitle: "Want advanced tools",
      icon: Zap,
      description: "I'm comfortable with networking and want powerful features",
      color: "bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Welcome to Ripple! 👋</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            To personalize your experience, tell us about your networking experience level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedLevel === option.level;
            
            return (
              <button
                key={option.level}
                onClick={() => handleSelect(option.level)}
                disabled={isSaving}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `${option.color} border-primary ring-2 ring-primary ring-offset-2`
                    : "bg-card border-border hover:border-primary/50"
                } ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                    <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{option.title}</h3>
                      <span className="text-sm text-muted-foreground">({option.subtitle})</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {isSaving && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">Setting up your experience...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

