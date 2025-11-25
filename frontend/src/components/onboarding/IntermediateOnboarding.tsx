import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Target, FileText, Bell, TrendingUp, Sparkles, X, Calendar, BarChart3, Mail, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

interface IntermediateOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    id: 1,
    title: "Set Your Networking Goals",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Customize your goals to match your networking objectives. Here are some templates to get you started:
        </p>
        <div className="space-y-2">
          {[
            "Connect with 10 alumni this month",
            "Set 3 informational interviews by next week",
            "Attend 2 networking events this quarter",
            "Follow up with 5 contacts I met last month",
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
        <p className="text-xs text-muted-foreground">
          💡 You can always create custom goals or modify these templates to fit your needs.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: "Use Email Templates",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Quick Email Templates</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Ripple provides pre-written email templates for common networking scenarios:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Informational interview requests</li>
            <li>Follow-up after meetings</li>
            <li>Thank you emails</li>
            <li>Reconnecting with old contacts</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Customize templates to match your voice, then save them for future use!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Advanced Reminder Settings",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Reminder Types:</h3>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="p-2 bg-background rounded border">
              <strong>One-time reminders:</strong> For specific follow-ups after meetings or conversations
            </div>
            <div className="p-2 bg-background rounded border">
              <strong>Recurring reminders:</strong> Set weekly, monthly, or quarterly check-ins with priority contacts
            </div>
            <div className="p-2 bg-background rounded border">
              <strong>Tag-based reminders:</strong> Follow up with all contacts in a specific category
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Calendar Sync & Reminders",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Sync Your Calendar</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect your calendar to automatically:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Import meetings and events</li>
            <li>Set automatic follow-up reminders</li>
            <li>Track meeting frequency with contacts</li>
            <li>Never miss an important follow-up</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Calendar sync helps you maintain consistent touchpoints with your network.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Goal Statistics & Trends",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Track Your Progress</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            View detailed statistics and trends:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Goal completion rates over time</li>
            <li>Networking activity trends</li>
            <li>Contact growth metrics</li>
            <li>Follow-up consistency scores</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Use statistics to identify what's working and adjust your strategy.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: "Template Customization",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Customize Templates</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Make templates your own:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Edit pre-written templates to match your voice</li>
            <li>Create custom templates for specific situations</li>
            <li>Save frequently used templates for quick access</li>
            <li>Use variables to personalize messages</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    title: "Plugin Integration",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Gmail Plugin</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Automate your networking workflow:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Auto-log emails as interactions</li>
            <li>Extract contact information automatically</li>
            <li>Set follow-up reminders from emails</li>
            <li>Track relationship health based on email frequency</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> The plugin saves time by eliminating manual data entry.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    title: "Relationship Health Tracking",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Monitor Relationship Health</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep track of your relationships:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>See which relationships need attention</li>
            <li>Track interaction frequency</li>
            <li>Identify contacts you haven't reached out to recently</li>
            <li>Get suggestions for re-engaging</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Healthy relationships require consistent communication.
          </p>
        </div>
      </div>
    ),
  },
];

export const IntermediateOnboarding = ({ open, onComplete }: IntermediateOnboardingProps) => {
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
      toast.success("Welcome to Ripple!");
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
            Step {currentStep + 1} of {STEPS.length} - Quick overview
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

