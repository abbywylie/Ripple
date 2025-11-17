import { useState, useEffect } from "react";
import { Sparkles, BookOpen, Heart, Target, Cookie, Star, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CardType = "quote" | "resource" | "prompt" | "challenge" | "fortune";

interface RippleCard {
  type: CardType;
  content: string;
  title: string;
  icon: typeof Sparkles;
}

const CARD_TYPES: CardType[] = ["quote", "resource", "prompt", "challenge", "fortune"];

const CARD_CONTENT: Record<CardType, RippleCard[]> = {
  quote: [
    {
      type: "quote",
      title: "Today's Quote",
      content: "Reaching out is a strength, not a weakness.",
      icon: Sparkles,
    },
    {
      type: "quote",
      title: "Today's Quote",
      content: "Your network is your net worth.",
      icon: Sparkles,
    },
    {
      type: "quote",
      title: "Today's Quote",
      content: "Every connection is a new opportunity.",
      icon: Sparkles,
    },
  ],
  resource: [
    {
      type: "resource",
      title: "Learning Resource",
      content: "Read: 'Never Eat Alone' by Keith Ferrazzi - master the art of networking.",
      icon: BookOpen,
    },
    {
      type: "resource",
      title: "Learning Resource",
      content: "Watch: TED Talk 'The Power of Weak Ties' - understand connection strength.",
      icon: BookOpen,
    },
    {
      type: "resource",
      title: "Learning Resource",
      content: "Article: 'How to Write a Follow-Up Email That Gets Responses'.",
      icon: BookOpen,
    },
  ],
  prompt: [
    {
      type: "prompt",
      title: "Social Good Prompt",
      content: "Reach out to someone you haven't spoken to in 6 months. Ask how they're doing.",
      icon: Heart,
    },
    {
      type: "prompt",
      title: "Social Good Prompt",
      content: "Share a helpful resource with a contact who might benefit from it.",
      icon: Heart,
    },
    {
      type: "prompt",
      title: "Social Good Prompt",
      content: "Thank someone who helped you in your career journey.",
      icon: Heart,
    },
  ],
  challenge: [
    {
      type: "challenge",
      title: "Today's Challenge",
      content: "Add a new contact before Friday!",
      icon: Target,
    },
    {
      type: "challenge",
      title: "Today's Challenge",
      content: "Send 3 follow-up emails this week.",
      icon: Target,
    },
    {
      type: "challenge",
      title: "Today's Challenge",
      content: "Schedule one informational interview this month.",
      icon: Target,
    },
  ],
  fortune: [
    {
      type: "fortune",
      title: "Your Fortune",
      content: "You'll receive good news soon.",
      icon: Cookie,
    },
    {
      type: "fortune",
      title: "Your Fortune",
      content: "A new opportunity is coming your way.",
      icon: Cookie,
    },
    {
      type: "fortune",
      title: "Your Fortune",
      content: "Your dream job is one email away.",
      icon: Cookie,
    },
  ],
};

const PINNED_RIPPLE_KEY = "pinnedRipple";

export const DailyRipple = () => {
  const [currentCard, setCurrentCard] = useState<RippleCard | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load pinned card or generate random one
  useEffect(() => {
    const loadCard = () => {
      try {
        // Check for pinned card
        const pinned = localStorage.getItem(PINNED_RIPPLE_KEY);
        if (pinned) {
          const pinnedCard = JSON.parse(pinned);
          setCurrentCard(pinnedCard);
          setIsPinned(true);
        } else {
          // Generate random card
          generateRandomCard();
        }
      } catch (error) {
        console.error("Failed to load ripple card:", error);
        generateRandomCard();
      } finally {
        setIsLoading(false);
      }
    };

    loadCard();
  }, []);

  const generateRandomCard = () => {
    // Pick random type
    const randomType = CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
    // Pick random card of that type
    const cardsOfType = CARD_CONTENT[randomType];
    const randomCard = cardsOfType[Math.floor(Math.random() * cardsOfType.length)];
    setCurrentCard(randomCard);
    setIsPinned(false);
  };

  const handlePin = () => {
    if (currentCard) {
      try {
        localStorage.setItem(PINNED_RIPPLE_KEY, JSON.stringify(currentCard));
        setIsPinned(true);
      } catch (error) {
        console.error("Failed to pin card:", error);
      }
    }
  };

  const handleUnpin = () => {
    try {
      localStorage.removeItem(PINNED_RIPPLE_KEY);
      setIsPinned(false);
      generateRandomCard();
    } catch (error) {
      console.error("Failed to unpin card:", error);
    }
  };

  const handleRotate = () => {
    generateRandomCard();
  };

  if (isLoading || !currentCard) {
    return null;
  }

  const IconComponent = currentCard.icon;

  return (
    <div className="px-4 pb-4 mt-auto">
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <IconComponent className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-foreground mb-1">
                {currentCard.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentCard.content}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            {isPinned ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={handleUnpin}
                >
                  <X className="h-3 w-3 mr-1" />
                  Unpin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  New One
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={handlePin}
                >
                  <Star className="h-3 w-3 mr-1" />
                  Keep
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  Another
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

