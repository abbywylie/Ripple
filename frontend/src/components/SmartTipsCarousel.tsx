import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { useFeatureUnlock } from "@/hooks/useFeatureUnlock";

const EFFICIENCY_TIPS = [
  {
    id: 1,
    title: "Batch Your Outreach",
    content: "Set aside 30 minutes weekly to send multiple follow-up emails. Batching saves time and keeps you consistent.",
  },
  {
    id: 2,
    title: "Use Template Variables",
    content: "Create templates with variables like {{name}} and {{company}} to personalize messages quickly.",
  },
  {
    id: 3,
    title: "Set Recurring Reminders",
    content: "For priority contacts, set recurring reminders (e.g., monthly) so you never forget to check in.",
  },
  {
    id: 4,
    title: "Tag Your Contacts",
    content: "Use tags to organize contacts by industry, event, or relationship type. Makes filtering and follow-ups easier.",
  },
  {
    id: 5,
    title: "Calendar Integration",
    content: "Sync your calendar to automatically create reminders after meetings. No manual entry needed!",
  },
  {
    id: 6,
    title: "Track Relationship Health",
    content: "Regularly review relationship health scores to identify contacts who need attention.",
  },
];

export const SmartTipsCarousel = () => {
  const { experienceLevel } = useFeatureUnlock();
  const [currentTip, setCurrentTip] = useState(0);

  // Only show for intermediate users
  if (experienceLevel !== "intermediate") {
    return null;
  }

  useEffect(() => {
    // Auto-rotate tips every 8 seconds
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % EFFICIENCY_TIPS.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    setCurrentTip((prev) => (prev - 1 + EFFICIENCY_TIPS.length) % EFFICIENCY_TIPS.length);
  };

  const handleNext = () => {
    setCurrentTip((prev) => (prev + 1) % EFFICIENCY_TIPS.length);
  };

  const tip = EFFICIENCY_TIPS[currentTip];

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Smart Tip</h4>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {currentTip + 1} / {EFFICIENCY_TIPS.length}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{tip.title}</p>
            <p className="text-xs text-muted-foreground">{tip.content}</p>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNext}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex gap-1 mt-3 justify-center">
          {EFFICIENCY_TIPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTip(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentTip
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 w-1.5"
              }`}
              aria-label={`Go to tip ${index + 1}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

