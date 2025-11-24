import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles } from "lucide-react";
import { ExperienceLevelSelection } from "./ExperienceLevelSelection";
import { useAuth } from "@/contexts/AuthContext";

export const DontKnowWhereToStart = () => {
  const { user } = useAuth();
  const [showLevelSelection, setShowLevelSelection] = useState(false);

  if (!user) return null;

  const handleOpen = () => {
    setShowLevelSelection(true);
  };

  const handleClose = () => {
    setShowLevelSelection(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpen}
        className="w-full border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Don't Know Where to Start?
      </Button>

      {showLevelSelection && (
        <ExperienceLevelSelection
          open={showLevelSelection}
          onComplete={(level) => {
            handleClose();
            // Optionally restart onboarding or show tour
            window.location.reload();
          }}
        />
      )}
    </>
  );
};

