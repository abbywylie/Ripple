import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useLocation } from "react-router-dom";

const TOUR_STORAGE_KEY = "ripple_tour_completed";
const TOUR_STEPS = [
  {
    id: "contacts",
    target: '[data-tour="contacts"]',
    title: "Build Your Network",
    description: "Start by building your network! Click Contacts to view or add people you want to stay in touch with.",
    action: "Click Contacts to continue",
    route: "/contacts",
  },
  {
    id: "add-contact",
    target: '[data-tour="add-contact"]',
    title: "Add New Connections",
    description: "This is where you create entries for new people you meet – include name, role, and how you met.",
    action: "Click + Add Contact",
    route: "/contacts",
  },
  {
    id: "meetings",
    target: '[data-tour="meetings"]',
    title: "Log Your Conversations",
    description: "Track past or upcoming conversations to maintain meaningful relationships.",
    action: "Click Meetings",
    route: "/meetings",
  },
  {
    id: "goals",
    target: '[data-tour="goals"]',
    title: "Set Follow-up Goals",
    description: "Set goals to maintain meaningful relationships and track your networking progress.",
    action: "Click Goals",
    route: "/goals",
  },
  {
    id: "reminders",
    target: '[data-tour="reminders"]',
    title: "Never Miss a Follow-up",
    description: "Get pinged when it's time to reconnect! Stay on top of your networking commitments.",
    action: "Click Reminders",
    route: "/reminders",
  },
  {
    id: "progress",
    target: '[data-tour="progress"]',
    title: "Track Your Growth",
    description: "Track who you're engaging with most, and how strong your relationships are over time.",
    action: "Click Progress",
    route: "/progress",
  },
  {
    id: "dashboard",
    target: '[data-tour="dashboard"]',
    title: "Your Command Center",
    description: "Your all-in-one home for reminders, meetings, and goals – updated daily.",
    action: "Click Dashboard",
    route: "/dashboard",
  },
  {
    id: "chatbot",
    target: '[data-tour="chatbot"]',
    title: "Your Networking Assistant",
    description: "Ask the Ripple Bot anything about networking – from email templates to how to follow up after a coffee chat.",
    action: "Click the chat icon",
    route: null, // Chatbot is always visible
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if tour should start
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed && location.pathname !== "/login" && location.pathname !== "/register" && location.pathname !== "/") {
      // Small delay to let page render
      setTimeout(() => {
        setShowWelcome(true);
      }, 1000);
    }
  }, [location.pathname]);

  // Handle step highlighting
  useEffect(() => {
    if (!isActive || currentStep >= TOUR_STEPS.length) return;

    const step = TOUR_STEPS[currentStep];
    
    // Navigate first if needed
    if (step.route && location.pathname !== step.route) {
      navigate(step.route);
      // Wait for navigation, then find element
      setTimeout(() => {
        const element = document.querySelector(step.target) as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Add highlight class
          element.classList.add("ring-4", "ring-primary", "ring-offset-2", "z-50", "relative");
        }
      }, 500);
    } else {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add highlight class
        element.classList.add("ring-4", "ring-primary", "ring-offset-2", "z-50", "relative");
      } else {
        // If element not found, wait a bit and try again
        const timer = setTimeout(() => {
          const retryElement = document.querySelector(step.target) as HTMLElement;
          if (retryElement) {
            setHighlightedElement(retryElement);
            retryElement.scrollIntoView({ behavior: "smooth", block: "center" });
            retryElement.classList.add("ring-4", "ring-primary", "ring-offset-2", "z-50", "relative");
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }

    // Cleanup: remove highlight from previous element
    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove("ring-4", "ring-primary", "ring-offset-2", "z-50", "relative");
      }
    };
  }, [currentStep, isActive, navigate, location.pathname]);

  const startTour = () => {
    setShowWelcome(false);
    setIsActive(true);
    setCurrentStep(0);
  };

  const skipTour = () => {
    setShowWelcome(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onComplete?.();
  };

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    setHighlightedElement(null);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    onComplete?.();
  };

  // Handle element click - use a more reliable approach
  useEffect(() => {
    if (!isActive || !highlightedElement) return;

    const step = TOUR_STEPS[currentStep];
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element or its parent matches the target
      if (target.closest(step.target) || highlightedElement.contains(target)) {
        e.stopPropagation();
        // Small delay to let navigation happen
        setTimeout(() => {
          setCurrentStep((prev) => {
            if (prev < TOUR_STEPS.length - 1) {
              return prev + 1;
            } else {
              // Complete tour on last step
              setIsActive(false);
              setHighlightedElement(null);
              localStorage.setItem(TOUR_STORAGE_KEY, "true");
              onComplete?.();
              return prev;
            }
          });
        }, 300);
      }
    };

    highlightedElement.addEventListener("click", handleClick, true);
    return () => {
      highlightedElement.removeEventListener("click", handleClick, true);
    };
  }, [highlightedElement, isActive, currentStep, onComplete]);

  // Calculate overlay positions
  const getOverlayStyle = () => {
    if (!highlightedElement) return {};

    const rect = highlightedElement.getBoundingClientRect();
    return {
      clipPath: `polygon(
        0% 0%,
        0% 100%,
        ${rect.left}px 100%,
        ${rect.left}px ${rect.top}px,
        ${rect.right}px ${rect.top}px,
        ${rect.right}px ${rect.bottom}px,
        ${rect.left}px ${rect.bottom}px,
        ${rect.left}px 100%,
        100% 100%,
        100% 0%
      )`,
    };
  };

  const currentStepData = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <>
      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <DialogTitle>Welcome to Ripple 👋</DialogTitle>
            </div>
            <DialogDescription>
              Want a quick 1-minute tour to get started? We'll show you the key features.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button onClick={startTour} className="flex-1">
              Take Tour
            </Button>
            <Button onClick={skipTour} variant="outline" className="flex-1">
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tour Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          {/* Dark overlay with cutout */}
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
            style={getOverlayStyle()}
          />
        </div>
      )}

      {/* Tooltip */}
      {isActive && highlightedElement && currentStepData && (
        <div className="fixed z-[9999] pointer-events-auto">
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-sm animate-in fade-in slide-in-from-bottom-4"
            style={{
              top: Math.min(
                highlightedElement.getBoundingClientRect().bottom + 16,
                window.innerHeight - 300
              ),
              left: Math.min(
                Math.max(16, highlightedElement.getBoundingClientRect().left),
                window.innerWidth - 400
              ),
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{currentStepData.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Step {currentStep + 1} of {TOUR_STEPS.length}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={completeTour}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {currentStepData.description}
            </p>

            <div className="mb-4">
              <Progress value={progress} className="h-1.5" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={skipTour}
                className="text-xs"
              >
                Skip Tour
              </Button>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="text-xs"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="text-xs"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>

            {currentStepData.action && (
              <p className="text-xs text-primary mt-3 font-medium">
                💡 {currentStepData.action}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Hook to check if tour is completed
export const useTourCompleted = () => {
  return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
};

// Hook to reset tour (for testing or "Rewatch Tour" feature)
export const resetTour = () => {
  localStorage.removeItem(TOUR_STORAGE_KEY);
};

