import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useFeatureUnlock } from "@/hooks/useFeatureUnlock";

interface FeatureLockedOverlayProps {
  feature: string;
  requiredLevel: "beginner" | "intermediate" | "advanced";
  unlockMessage?: string;
  onUpgrade?: () => void;
}

export const FeatureLockedOverlay = ({
  feature,
  requiredLevel,
  unlockMessage,
  onUpgrade,
}: FeatureLockedOverlayProps) => {
  const { experienceLevel, isFeatureUnlocked } = useFeatureUnlock();

  if (isFeatureUnlocked(requiredLevel)) {
    return null; // Feature is unlocked, don't show overlay
  }

  const levelNames = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  const getUnlockMessage = () => {
    if (unlockMessage) return unlockMessage;
    
    if (experienceLevel === "beginner" && requiredLevel === "intermediate") {
      return "Complete 3 out of 5 basic actions to unlock Intermediate features!";
    }
    if (experienceLevel === "intermediate" && requiredLevel === "advanced") {
      return "Complete 3 informational interviews OR use plugin to auto-log 5 interactions to unlock Advanced features!";
    }
    return `This feature requires ${levelNames[requiredLevel]} level. Upgrade to unlock!`;
  };

  return (
    <Card className="border-dashed border-2 border-muted bg-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Feature Locked</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{getUnlockMessage()}</p>
        {onUpgrade && (
          <Button onClick={onUpgrade} size="sm" className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            View Progress
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

