import { useState, useEffect, useRef } from "react";
import { Sparkles, BookOpen, Heart, Target, Cookie, Star, RotateCw, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CardType = "quote" | "resource" | "prompt" | "challenge" | "fortune";

interface RippleCard {
  type: CardType;
  content: string;
  title: string;
  iconType: string; // Store as string for localStorage serialization
}

const CARD_TYPES: CardType[] = ["quote", "resource", "prompt", "challenge", "fortune"];

// Icon mapping for serialization
const ICON_MAP: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  bookOpen: BookOpen,
  heart: Heart,
  target: Target,
  cookie: Cookie,
};

const CARD_CONTENT: Record<CardType, RippleCard[]> = {
  quote: [
    {
      type: "quote",
      title: "Today's Quote",
      content: "Reaching out is a strength, not a weakness.",
      iconType: "sparkles",
    },
    {
      type: "quote",
      title: "Today's Quote",
      content: "Your network is your net worth.",
      iconType: "sparkles",
    },
    {
      type: "quote",
      title: "Today's Quote",
      content: "Every connection is a new opportunity.",
      iconType: "sparkles",
    },
  ],
  resource: [
    {
      type: "resource",
      title: "Learning Resource",
      content: "Read: 'Never Eat Alone' by Keith Ferrazzi - master the art of networking.",
      iconType: "bookOpen",
    },
    {
      type: "resource",
      title: "Learning Resource",
      content: "Watch: TED Talk 'The Power of Weak Ties' - understand connection strength.",
      iconType: "bookOpen",
    },
    {
      type: "resource",
      title: "Learning Resource",
      content: "Article: 'How to Write a Follow-Up Email That Gets Responses'.",
      iconType: "bookOpen",
    },
  ],
  prompt: [
    {
      type: "prompt",
      title: "Social Good Prompt",
      content: "Reach out to someone you haven't spoken to in 6 months. Ask how they're doing.",
      iconType: "heart",
    },
    {
      type: "prompt",
      title: "Social Good Prompt",
      content: "Share a helpful resource with a contact who might benefit from it.",
      iconType: "heart",
    },
    {
      type: "prompt",
      title: "Social Good Prompt",
      content: "Thank someone who helped you in your career journey.",
      iconType: "heart",
    },
  ],
  challenge: [
    {
      type: "challenge",
      title: "Today's Challenge",
      content: "Add a new contact before Friday!",
      iconType: "target",
    },
    {
      type: "challenge",
      title: "Today's Challenge",
      content: "Send 3 follow-up emails this week.",
      iconType: "target",
    },
    {
      type: "challenge",
      title: "Today's Challenge",
      content: "Schedule one informational interview this month.",
      iconType: "target",
    },
  ],
  fortune: [
    {
      type: "fortune",
      title: "Your Fortune",
      content: "You'll receive good news soon.",
      iconType: "cookie",
    },
    {
      type: "fortune",
      title: "Your Fortune",
      content: "A new opportunity is coming your way.",
      iconType: "cookie",
    },
    {
      type: "fortune",
      title: "Your Fortune",
      content: "Your dream job is one email away.",
      iconType: "cookie",
    },
  ],
};

const PINNED_RIPPLE_KEY = "pinnedRipple";

export const DailyRipple = () => {
  const [allCards, setAllCards] = useState<RippleCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Generate all cards for carousel
  useEffect(() => {
    const generateAllCards = () => {
      const cards: RippleCard[] = [];
      // Get one random card from each type
      CARD_TYPES.forEach((type) => {
        const cardsOfType = CARD_CONTENT[type];
        const randomCard = cardsOfType[Math.floor(Math.random() * cardsOfType.length)];
        cards.push(randomCard);
      });
      // Shuffle the cards
      const shuffled = cards.sort(() => Math.random() - 0.5);
      setAllCards(shuffled);
    };

    generateAllCards();
  }, []);

  // Load pinned card or set initial index
  useEffect(() => {
    const loadCard = () => {
      try {
        // Check for pinned card
        const pinned = localStorage.getItem(PINNED_RIPPLE_KEY);
        if (pinned) {
          const pinnedCard = JSON.parse(pinned);
          // Migrate old format (with icon component) to new format (with iconType string)
          if (pinnedCard.icon && !pinnedCard.iconType) {
            // Old format detected - clear it
            localStorage.removeItem(PINNED_RIPPLE_KEY);
            setIsPinned(false);
            setCurrentIndex(0);
            return;
          }
          // Validate iconType exists
          if (!pinnedCard.iconType || !ICON_MAP[pinnedCard.iconType]) {
            // Invalid iconType - clear it
            localStorage.removeItem(PINNED_RIPPLE_KEY);
            setIsPinned(false);
            setCurrentIndex(0);
            return;
          }
          // Find the pinned card in our carousel or add it
          const cardIndex = allCards.findIndex(
            (card) => card.type === pinnedCard.type && card.content === pinnedCard.content
          );
          if (cardIndex !== -1) {
            setCurrentIndex(cardIndex);
          } else {
            // Add pinned card to the beginning
            setAllCards([pinnedCard, ...allCards]);
            setCurrentIndex(0);
          }
          setIsPinned(true);
        } else {
          setIsPinned(false);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error("Failed to load ripple card:", error);
        // Clear corrupted data
        localStorage.removeItem(PINNED_RIPPLE_KEY);
        setIsPinned(false);
        setCurrentIndex(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (allCards.length > 0) {
      loadCard();
    }
  }, [allCards]);

  const handlePin = () => {
    const currentCard = allCards[currentIndex];
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
    } catch (error) {
      console.error("Failed to unpin card:", error);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allCards.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allCards.length) % allCards.length);
  };

  const scrollToCard = (index: number) => {
    setCurrentIndex(index);
    if (carouselRef.current) {
      const cardElement = carouselRef.current.children[index] as HTMLElement;
      cardElement?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  if (isLoading || allCards.length === 0) {
    return null;
  }

  const currentCard = allCards[currentIndex];
  const IconComponent = ICON_MAP[currentCard.iconType] || Sparkles;

  return (
    <div className={`px-4 pb-4 mt-auto transition-all duration-300 ${isPinned ? 'px-2' : ''}`}>
      <Card className={`border-border/50 bg-card/50 transition-all duration-300 ${isPinned ? 'shadow-lg' : ''}`}>
        <CardContent className={`p-4 transition-all duration-300 ${isPinned ? 'p-6' : ''}`}>
          {/* Carousel Container */}
          <div className="relative overflow-hidden">
            {/* Carousel Track */}
            <div
              ref={carouselRef}
              className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                transform: isPinned ? 'none' : `translateX(-${currentIndex * 100}%)`,
                transition: 'transform 0.3s ease-in-out',
              }}
            >
              {allCards.map((card, index) => {
                const CardIcon = ICON_MAP[card.iconType] || Sparkles;
                const isActive = index === currentIndex;
                const isActiveAndPinned = isActive && isPinned;

                return (
                  <div
                    key={`${card.type}-${index}`}
                    className={`flex-shrink-0 snap-center w-full transition-all duration-300 ${
                      isPinned && !isActive ? 'hidden' : ''
                    }`}
                  >
                    <div className={`transition-all duration-300 ${isActiveAndPinned ? 'scale-105' : ''}`}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          isActiveAndPinned ? 'h-10 w-10' : 'h-8 w-8'
                        }`}>
                          <CardIcon className={`text-primary transition-all duration-300 ${
                            isActiveAndPinned ? 'h-5 w-5' : 'h-4 w-4'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-foreground mb-1 transition-all duration-300 ${
                            isActiveAndPinned ? 'text-sm' : 'text-xs'
                          }`}>
                            {card.title}
                          </h4>
                          <p className={`text-muted-foreground leading-relaxed transition-all duration-300 ${
                            isActiveAndPinned ? 'text-sm' : 'text-xs'
                          }`}>
                            {card.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons - Only show if not pinned */}
            {!isPinned && allCards.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 bg-background/80 hover:bg-background shadow-sm"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 bg-background/80 hover:bg-background shadow-sm"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Carousel Dots - Only show if not pinned */}
            {!isPinned && allCards.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {allCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToCard(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-6 bg-primary'
                        : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to card ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
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
                {allCards.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={handleNext}
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    Next
                  </Button>
                )}
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
                {allCards.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Next
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

