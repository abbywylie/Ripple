import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Target, Zap, BarChart3, TrendingUp, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

interface ExperiencedOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    id: 1,
    title: "Advanced Goal Setting",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Set sophisticated networking goals with multiple steps and metrics:
        </p>
        <div className="space-y-2">
          {[
            "Contact 20 people this month across 5 industries",
            "Set up 5 informational interviews with C-level executives",
            "Attend 3 industry events and follow up with 10+ contacts",
            "Build relationships with 15 new contacts in target companies",
          ].map((goal, index) => (
            <button
              key={index}
              className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm">{goal}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 Use the Advanced Goal Tracker to break down complex goals into actionable steps.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Power Features",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Advanced Tools Available:</h3>
          </div>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-semibold">• Email Templates:</span>
              <span>Custom templates with variables and automation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">• Automated Follow-ups:</span>
              <span>Set up recurring reminders and tag-based follow-ups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">• Bulk Actions:</span>
              <span>Manage multiple contacts and goals efficiently</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">• Analytics Dashboard:</span>
              <span>Track relationship health and networking metrics</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Analytics & Insights",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Track Your Networking Activity:</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Use the dashboard and progress pages to monitor:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Contact growth over time</li>
            <li>Follow-up consistency rates</li>
            <li>Goal completion metrics</li>
            <li>Relationship strength indicators</li>
            <li>Most active networking channels</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Pro tip:</strong> Use insights to identify which networking strategies work best for you.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Customize Your Strategy",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Build Your Networking Strategy:</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Set complex, long-term goals and break them down into actionable steps:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Create multi-step goals with deadlines</li>
            <li>Set up automated reminder sequences</li>
            <li>Track progress across multiple goals simultaneously</li>
            <li>Use tags and categories to organize your network</li>
          </ul>
        </div>
        <div className="bg-accent/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Power user tip:</strong> Use keyboard shortcuts and bulk actions to manage your network efficiently.
          </p>
        </div>
      </div>
    ),
  },
];

export const ExperiencedOnboarding = ({ open, onComplete }: ExperiencedOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await authApi.updateProfile({ onboarding_completed: true });
      toast.success("Welcome to Ripple! Let's maximize your networking.");
      onComplete();
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      onComplete();
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <DialogTitle>Welcome to Ripple</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Step {currentStep + 1} of {STEPS.length} - Advanced features
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Progress value={progress} className="mb-6" />
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
            {currentStepData.content}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleNext}>
              {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

