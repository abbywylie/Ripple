import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const ProgressChecklist = () => {
  const { progress, loading } = useProgressTracking();
  const { user } = useAuth();

  const handleLevelUp = async () => {
    if (!progress?.canUnlockNext || !user) return;

    let nextLevel: "intermediate" | "advanced" | null = null;
    if (progress.level === "beginner") {
      nextLevel = "intermediate";
    } else if (progress.level === "intermediate") {
      nextLevel = "advanced";
    }

    if (!nextLevel) return;

    try {
      await authApi.updateProfile({ experience_level: nextLevel });
      toast.success(`Congratulations! You've unlocked ${nextLevel} features!`);
      window.location.reload(); // Refresh to show new features
    } catch (error) {
      toast.error("Failed to upgrade level");
      console.error(error);
    }
  };

  if (loading || !progress) {
    return null;
  }

  if (progress.level === "advanced") {
    return null; // No progress tracking for advanced users
  }

  const progressPercentage = (progress.completed / progress.total) * 100;
  const levelNames = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  const nextLevelName = progress.level === "beginner" ? "Intermediate" : "Advanced";

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Progress to {nextLevelName} Level</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {progress.completed} of {progress.total} completed
            </span>
            <span className="font-semibold">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          {progress.checklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={item.completed ? "text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {progress.canUnlockNext && (
          <Button onClick={handleLevelUp} className="w-full bg-primary hover:bg-primary/90">
            Unlock {nextLevelName} Features
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

