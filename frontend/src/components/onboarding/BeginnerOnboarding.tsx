import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Users, Target, Bell, Sparkles, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

interface BeginnerOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    id: 1,
    title: "What is Networking?",
    content: (
      <div className="space-y-4">
        <div className="bg-primary/10 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Networking is building relationships</h3>
          <p className="text-sm text-muted-foreground">
            It's about creating genuine connections with people who can help you grow professionally, 
            and who you can help in return. Think of it as building your professional community.
          </p>
        </div>
        <div className="bg-accent/10 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Why is it important?</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Opens doors to new opportunities</li>
            <li>Helps you learn from others' experiences</li>
            <li>Builds your professional reputation</li>
            <li>Creates a support system for your career</li>
          </ul>
        </div>
        <a 
          href="https://www.linkedin.com/pulse/why-networking-important-your-career" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Learn More <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    ),
  },
  {
    id: 2,
    title: "How to Add Your First Contact",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Step-by-step guide:</h3>
          </div>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Click the "Add Contact" button in the Contacts page</li>
            <li>Fill in their name, company, and role</li>
            <li>Add how you met them (optional but helpful!)</li>
            <li>Set a reminder for when to follow up</li>
          </ol>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Pro tip:</strong> Use email templates to make your outreach easier. 
            Ripple provides ready-to-use templates for different situations!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "How to Use Pre-Written Templates",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Email Templates:</h3>
          </div>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• Ripple provides pre-written email templates for common networking scenarios</li>
            <li>• Use templates for informational interview requests, follow-ups, thank you emails</li>
            <li>• Customize templates to match your voice and situation</li>
            <li>• Save your customized templates for future use</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Templates save time and help you maintain a professional tone!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Setting a Follow-Up Reminder",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">How reminders work:</h3>
          </div>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• Reminders help you stay consistent with follow-ups</li>
            <li>• Set a reminder when you add a contact or after a meeting</li>
            <li>• Ripple will notify you when it's time to reach out</li>
            <li>• Start with a 7-day follow-up reminder for new contacts</li>
          </ul>
        </div>
        <div className="bg-accent/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Remember:</strong> Consistency is key! Even a quick "checking in" message 
            keeps relationships warm.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Creating Your First Goal",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          What would you like to achieve with networking this month? Choose one to get started:
        </p>
        <div className="space-y-2">
          {[
            "Reach out to 3 alumni",
            "Attend 1 networking event",
            "Set up 2 informational interviews",
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
          💡 Don't worry, you can always add more goals later!
        </p>
      </div>
    ),
  },
  {
    id: 6,
    title: "Dashboard Overview",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Your Dashboard:</h3>
          </div>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• View your contacts, goals, and reminders at a glance</li>
            <li>• Quick actions to add contacts or create goals</li>
            <li>• Track your progress with the checklist</li>
            <li>• Get contextual tips based on your activity</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Next:</strong> Complete 3 out of 5 basic actions to unlock Intermediate features!
          </p>
        </div>
      </div>
    ),
  },
];

export const BeginnerOnboarding = ({ open, onComplete }: BeginnerOnboardingProps) => {
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
      toast.success("Welcome to Ripple! Let's get started.");
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
              <DialogTitle>Getting Started with Networking</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Step {currentStep + 1} of {STEPS.length}
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
              Skip Tutorial
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

