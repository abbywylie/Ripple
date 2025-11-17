import { useState, useEffect, useRef } from "react";
import { Sparkles, BookOpen, Heart, Target, Cookie, Star, RotateCw, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    {
      type: "quote",
      title: "Today's Quote",
      content: "The best time to build your network was yesterday. The second best time is now.",
      iconType: "sparkles",
    },
    {
      type: "quote",
      title: "Today's Quote",
      content: "Success is not about who you know, but who knows you.",
      iconType: "sparkles",
    },
    {
      type: "quote",
      title: "Today's Quote",
      content: "A simple follow-up can turn a meeting into a meaningful relationship.",
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
    {
      type: "resource",
      title: "Learning Resource",
      content: "Podcast: 'How I Built This' - learn from successful entrepreneurs' networking stories.",
      iconType: "bookOpen",
    },
    {
      type: "resource",
      title: "Learning Resource",
      content: "Book: 'Give and Take' by Adam Grant - understand the power of reciprocity.",
      iconType: "bookOpen",
    },
    {
      type: "resource",
      title: "Learning Resource",
      content: "Course: LinkedIn Learning 'Networking for Career Success' - build skills systematically.",
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
    {
      type: "prompt",
      title: "Social Good Prompt",
      content: "Introduce two contacts who could benefit from knowing each other.",
      iconType: "heart",
    },
    {
      type: "prompt",
      title: "Social Good Prompt",
      content: "Congratulate a contact on a recent achievement or milestone.",
      iconType: "heart",
    },
    {
      type: "prompt",
      title: "Social Good Prompt",
      content: "Offer to help a contact with something they're working on.",
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
    {
      type: "challenge",
      title: "Today's Challenge",
      content: "Update your LinkedIn profile with recent achievements.",
      iconType: "target",
    },
    {
      type: "challenge",
      title: "Today's Challenge",
      content: "Attend one networking event or virtual meetup this week.",
      iconType: "target",
    },
    {
      type: "challenge",
      title: "Today's Challenge",
      content: "Reconnect with 5 contacts from your past this month.",
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
    {
      type: "fortune",
      title: "Your Fortune",
      content: "A connection you make today will open doors tomorrow.",
      iconType: "cookie",
    },
    {
      type: "fortune",
      title: "Your Fortune",
      content: "Your networking efforts will pay off this month.",
      iconType: "cookie",
    },
    {
      type: "fortune",
      title: "Your Fortune",
      content: "Someone is thinking about reaching out to you.",
      iconType: "cookie",
    },
  ],
};

const PINNED_RIPPLE_KEY = "pinnedRipple";

export const DailyRipple = () => {
  const [allCards, setAllCards] = useState<RippleCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const [pinnedType, setPinnedType] = useState<CardType | null>(null);
  const [pinnedTypeCards, setPinnedTypeCards] = useState<RippleCard[]>([]);
  const [pinnedTypeIndex, setPinnedTypeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(10); // Countdown in seconds
  const carouselRef = useRef<HTMLDivElement>(null);

  // Generate all cards for carousel - picks random version from each type
  useEffect(() => {
    const generateAllCards = () => {
      const cards: RippleCard[] = [];
      // Get one random card from each type (different each page load)
      CARD_TYPES.forEach((type) => {
        const cardsOfType = CARD_CONTENT[type];
        // Pick a random card from this type's variations
        const randomIndex = Math.floor(Math.random() * cardsOfType.length);
        const randomCard = cardsOfType[randomIndex];
        cards.push({ ...randomCard }); // Create a copy
      });
      // Shuffle the order of card types for variety
      const shuffled = cards.sort(() => Math.random() - 0.5);
      setAllCards(shuffled);
    };

    // Only generate on mount (page load)
    generateAllCards();
  }, []); // Empty deps - only runs on mount

  // Load pinned type or set initial index
  useEffect(() => {
    const loadCard = () => {
      try {
        // Check for pinned type (new format) or pinned card (old format for migration)
        const pinned = localStorage.getItem(PINNED_RIPPLE_KEY);
        if (pinned) {
          const pinnedData = JSON.parse(pinned);
          
          // Check if it's the new format (just type) or old format (full card)
          if (pinnedData.type && !pinnedData.content) {
            // New format: just the type
            const type = pinnedData.type as CardType;
            if (CARD_TYPES.includes(type)) {
              setPinnedType(type);
              setPinnedTypeCards(CARD_CONTENT[type]);
              setPinnedTypeIndex(0);
              setIsPinned(true);
            } else {
              // Invalid type - clear it
              localStorage.removeItem(PINNED_RIPPLE_KEY);
              setIsPinned(false);
              setPinnedType(null);
            }
          } else if (pinnedData.type && pinnedData.content) {
            // Old format: migrate to new format (pin the type instead)
            const type = pinnedData.type as CardType;
            if (CARD_TYPES.includes(type)) {
              localStorage.setItem(PINNED_RIPPLE_KEY, JSON.stringify({ type }));
              setPinnedType(type);
              setPinnedTypeCards(CARD_CONTENT[type]);
              setPinnedTypeIndex(0);
              setIsPinned(true);
            } else {
              localStorage.removeItem(PINNED_RIPPLE_KEY);
              setIsPinned(false);
              setPinnedType(null);
            }
          } else {
            // Invalid format - clear it
            localStorage.removeItem(PINNED_RIPPLE_KEY);
            setIsPinned(false);
            setPinnedType(null);
          }
        } else {
          setIsPinned(false);
          setPinnedType(null);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error("Failed to load ripple card:", error);
        // Clear corrupted data
        localStorage.removeItem(PINNED_RIPPLE_KEY);
        setIsPinned(false);
        setPinnedType(null);
        setCurrentIndex(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (allCards.length > 0) {
      loadCard();
    }
  }, [allCards]);

  // Auto-cycle through cards - pinned type variations or all types
  useEffect(() => {
    const CYCLE_INTERVAL = 10000; // 10 seconds
    
    // Reset timer when cycle starts
    setTimeRemaining(10);
    
    if (isPinned && pinnedTypeCards.length > 1) {
      // Cycle through pinned type variations
      const interval = setInterval(() => {
        setPinnedTypeIndex((prev) => (prev + 1) % pinnedTypeCards.length);
        setTimeRemaining(10); // Reset countdown
      }, CYCLE_INTERVAL);

      return () => clearInterval(interval);
    } else if (!isPinned && allCards.length > 1) {
      // Cycle through all card types
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allCards.length);
        setTimeRemaining(10); // Reset countdown
      }, CYCLE_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [isPinned, pinnedTypeCards.length, allCards.length]);

  // Countdown timer - decrements every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 10; // Reset to 10 (will be synced by cycle interval)
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePin = () => {
    const currentCard = allCards[currentIndex];
    if (currentCard) {
      try {
        // Pin the TYPE, not the specific card
        localStorage.setItem(PINNED_RIPPLE_KEY, JSON.stringify({ type: currentCard.type }));
        setPinnedType(currentCard.type);
        setPinnedTypeCards(CARD_CONTENT[currentCard.type]);
        setPinnedTypeIndex(0);
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
      setPinnedType(null);
      setPinnedTypeCards([]);
      setPinnedTypeIndex(0);
    } catch (error) {
      console.error("Failed to unpin card:", error);
    }
  };

  const handleNext = () => {
    if (isPinned && pinnedTypeCards.length > 1) {
      // Cycle through pinned type variations
      setPinnedTypeIndex((prev) => (prev + 1) % pinnedTypeCards.length);
      setTimeRemaining(10); // Reset timer
    } else {
      // Cycle through all card types
      setCurrentIndex((prev) => (prev + 1) % allCards.length);
      setTimeRemaining(10); // Reset timer
    }
  };

  const handlePrev = () => {
    if (isPinned && pinnedTypeCards.length > 1) {
      // Cycle backwards through pinned type variations
      setPinnedTypeIndex((prev) => (prev - 1 + pinnedTypeCards.length) % pinnedTypeCards.length);
      setTimeRemaining(10); // Reset timer
    } else {
      // Cycle backwards through all card types
      setCurrentIndex((prev) => (prev - 1 + allCards.length) % allCards.length);
      setTimeRemaining(10); // Reset timer
    }
  };

  const scrollToCard = (index: number) => {
    setCurrentIndex(index);
    if (carouselRef.current && !isPinned) {
      const cardElement = carouselRef.current.children[index] as HTMLElement;
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  };

  // Sync scroll position with currentIndex (for auto-cycling and manual navigation)
  useEffect(() => {
    if (!isPinned && carouselRef.current && allCards.length > 0) {
      const cardElement = carouselRef.current.children[currentIndex] as HTMLElement;
      if (cardElement) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          cardElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }, 50);
      }
    }
  }, [currentIndex, isPinned, allCards.length]);

  if (isLoading || (allCards.length === 0 && !isPinned)) {
    return null;
  }

  // Get current card to display
  const currentCard = isPinned && pinnedTypeCards.length > 0
    ? pinnedTypeCards[pinnedTypeIndex]
    : allCards[currentIndex];
  
  if (!currentCard) return null;
  
  const IconComponent = ICON_MAP[currentCard.iconType] || Sparkles;

  // Calculate progress for ripple animation (0-100%)
  const progress = ((10 - timeRemaining) / 10) * 100;

  return (
    <div className={`px-4 pb-4 mt-auto transition-all duration-300 ${isPinned ? 'px-2' : ''}`}>
      <Card className={`border-border/50 bg-card/50 transition-all duration-300 ${isPinned ? 'shadow-lg' : ''}`}>
        <CardContent className={`transition-all duration-300 relative ${isPinned ? 'p-6' : 'p-4'}`}>
          {/* Ripple/Droplet Animation - Top Right */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 right-2 z-10 w-10 h-10 flex items-center justify-center overflow-visible">
                  {/* Ripple expanding animation container */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Multiple expanding ripple circles - progress-based animation */}
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-primary/40"
                      style={{
                        transform: `scale(${0.5 + (progress / 100) * 0.7})`,
                        opacity: Math.max(0, 1 - progress / 100),
                        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                      }}
                    />
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-primary/30"
                      style={{
                        transform: `scale(${0.3 + (progress / 100) * 0.9})`,
                        opacity: Math.max(0, 0.8 - (progress / 100) * 0.8),
                        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                      }}
                    />
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      style={{
                        transform: `scale(${0.2 + (progress / 100) * 1.0})`,
                        opacity: Math.max(0, 0.6 - (progress / 100) * 0.6),
                        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                      }}
                    />
                    {/* Droplet icon in center that moves down */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        transform: `translateY(${(progress / 100) * 6}px)`,
                        transition: 'transform 0.3s ease-out',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary drop-shadow-sm"
                      >
                        {/* Droplet shape - water drop */}
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Next message in {timeRemaining} second{timeRemaining !== 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Carousel Container */}
          <div className="relative overflow-hidden">
            {/* Carousel Track */}
            {isPinned && pinnedTypeCards.length > 0 ? (
              // Pinned mode: Show only cards of the pinned type, cycling through variations
              <div className="w-full">
                <div key={`pinned-${pinnedTypeIndex}`} className="w-full">
                  <div className="scale-105 transition-all duration-500">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground mb-1">
                          {currentCard.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {currentCard.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Show indicator that it's cycling */}
                {pinnedTypeCards.length > 1 && (
                  <div className="flex justify-center gap-1 mt-2">
                    {pinnedTypeCards.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          index === pinnedTypeIndex
                            ? 'w-4 bg-primary'
                            : 'w-1 bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Carousel mode: Show all cards side by side
              <div className="relative">
                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth gap-3"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {allCards.map((card, index) => {
                    const CardIcon = ICON_MAP[card.iconType] || Sparkles;
                    const isActive = index === currentIndex;

                    return (
                      <div
                        key={`${card.type}-${index}`}
                        className="flex-shrink-0 snap-center w-full min-w-full"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <CardIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-foreground mb-1">
                              {card.title}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {card.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                {allCards.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 bg-background/80 hover:bg-background shadow-sm z-10"
                      onClick={handlePrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 bg-background/80 hover:bg-background shadow-sm z-10"
                      onClick={handleNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Carousel Dots */}
                {allCards.length > 1 && (
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
                {pinnedTypeCards.length > 1 && (
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

