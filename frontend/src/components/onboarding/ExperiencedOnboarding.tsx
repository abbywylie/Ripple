import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Target, Zap, BarChart3, TrendingUp, Sparkles, X, Bot, Calendar, Upload, FileText, Lightbulb } from "lucide-react";
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
    title: "Full Analytics Dashboard",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Comprehensive Analytics</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Access detailed insights and metrics:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Relationship health scores and trends</li>
            <li>Networking activity patterns</li>
            <li>Goal completion analytics</li>
            <li>Contact growth and engagement metrics</li>
            <li>Identify strengths and areas for improvement</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Use analytics to optimize your networking strategy.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "AI-Suggested Contact Actions",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Smart Recommendations</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Get AI-powered suggestions based on relationship health:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Contacts who need follow-up attention</li>
            <li>Optimal timing for outreach</li>
            <li>Suggested conversation topics</li>
            <li>Relationship strengthening opportunities</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> AI suggestions help you prioritize your networking efforts.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Customized Cadence Builder",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Automated Follow-up Sequences</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Create custom cadences for different contact types:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Set monthly pings for priority contacts</li>
            <li>Quarterly check-ins for broader network</li>
            <li>Custom schedules based on relationship tier</li>
            <li>Automated reminder sequences</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Uploadable Notes from Conversations",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Capture Real Conversations</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload and store notes from your conversations:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Upload meeting notes and transcripts</li>
            <li>Store important conversation details</li>
            <li>Reference past discussions easily</li>
            <li>Build comprehensive contact history</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Detailed notes help you personalize future conversations.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: "Advanced Template Builder",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Build Powerful Templates</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Create sophisticated email templates:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Use variables and dynamic content</li>
            <li>Create conditional logic in templates</li>
            <li>Build template libraries for different scenarios</li>
            <li>Automate personalization at scale</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    title: "Full Knowledge Base & Advanced RAG Support",
    content: (
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Advanced AI Assistant</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Access comprehensive networking knowledge:
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Full knowledge base with networking best practices</li>
            <li>Advanced RAG chatbot for complex questions</li>
            <li>Context-aware suggestions based on your data</li>
            <li>Strategic networking advice tailored to your goals</li>
          </ul>
        </div>
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> The AI assistant learns from your networking patterns to provide better advice.
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

