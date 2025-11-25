import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, X, BookOpen } from "lucide-react";
import { useFeatureUnlock } from "@/hooks/useFeatureUnlock";

interface TutorialTooltipProps {
  feature: string;
  level: "beginner" | "intermediate" | "advanced";
  tooltipText: string;
  tutorialContent?: {
    title: string;
    description: string;
    steps?: string[];
    tips?: string[];
  };
  children: React.ReactNode;
}

export const TutorialTooltip = ({
  feature,
  level,
  tooltipText,
  tutorialContent,
  children,
}: TutorialTooltipProps) => {
  const { experienceLevel, isFeatureUnlocked } = useFeatureUnlock();
  const [showTutorial, setShowTutorial] = useState(false);

  // Only show tooltip if feature is unlocked for user's level
  if (!isFeatureUnlocked(level)) {
    return <>{children}</>;
  }

  // Only show tooltip for users at or below the feature's level
  const shouldShowTooltip = 
    experienceLevel === level || 
    (level === "intermediate" && experienceLevel === "beginner") ||
    (level === "advanced" && (experienceLevel === "beginner" || experienceLevel === "intermediate"));

  if (!shouldShowTooltip) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            {children}
            {experienceLevel === level && (
              <HelpCircle className="absolute -top-1 -right-1 h-4 w-4 text-primary bg-background rounded-full border-2 border-background" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="text-sm">{tooltipText}</p>
            {tutorialContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTutorial(true)}
                className="w-full mt-2 text-xs"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Learn More
              </Button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {tutorialContent && showTutorial && (
        <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {tutorialContent.title}
              </DialogTitle>
              <DialogDescription>{tutorialContent.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {tutorialContent.steps && (
                <div>
                  <h4 className="font-semibold mb-2">Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {tutorialContent.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              {tutorialContent.tips && (
                <div>
                  <h4 className="font-semibold mb-2">Tips:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {tutorialContent.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowTutorial(false)}>Got it</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
};

