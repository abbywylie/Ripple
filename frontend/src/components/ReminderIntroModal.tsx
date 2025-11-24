import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Sparkles, Calendar, Repeat, Tag, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const HIDE_KEY = "ripple_reminder_intro_hide";

export const ReminderIntroModal = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user?.userId) {
      setOpen(false);
      return;
    }

    // Only show on dashboard
    if (location.pathname !== "/dashboard") {
      setOpen(false);
      return;
    }

    // Check if user has permanently hidden it
    const permanentlyHidden = localStorage.getItem(HIDE_KEY) === "true";
    if (permanentlyHidden) {
      setOpen(false);
      return;
    }

    // Show every time they visit the dashboard (unless hidden)
    // Small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      setOpen(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [user?.userId, location.pathname]);

  const handleClose = () => setOpen(false);

  const handleNeverShow = () => {
    localStorage.setItem(HIDE_KEY, "true");
    setOpen(false);
  };

  if (!user?.userId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh] p-4' : 'max-w-2xl'} flex flex-col ${isMobile ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <DialogHeader className={`${isMobile ? 'space-y-1 pb-2 flex-shrink-0' : 'space-y-2'}`}>
          <DialogTitle className={`${isMobile ? 'text-lg' : 'text-2xl'} flex items-center gap-2`}>
            <Sparkles className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
            {isMobile ? 'Ripple Reminders' : 'Welcome to Ripple Reminders'}
          </DialogTitle>
          {!isMobile && (
            <DialogDescription className="text-base text-muted-foreground">
              A quick guide before the tour—here's how reminders keep your networking consistent.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className={`${isMobile ? 'space-y-3 text-xs' : 'space-y-6 text-sm'} text-muted-foreground ${isMobile ? 'leading-snug' : 'leading-relaxed'} ${isMobile ? 'overflow-y-auto flex-1 min-h-0' : ''} pr-1`}>
          {isMobile ? (
            // Compact mobile version
            <>
              <section className="space-y-1.5">
                <p className="font-medium text-foreground text-sm">What Are Reminders?</p>
                <p>Set follow-ups, prep notes, and recurring check-ins to stay consistent with your network.</p>
              </section>

              <section className="grid gap-2 grid-cols-1">
                <div className="rounded-lg border p-2.5">
                  <div className="flex items-center gap-1.5 text-primary font-semibold mb-0.5 text-xs">
                    <Calendar className="h-3.5 w-3.5" /> One-time
                  </div>
                  <p className="text-xs text-muted-foreground">"Email Alex next Monday"</p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <div className="flex items-center gap-1.5 text-primary font-semibold mb-0.5 text-xs">
                    <Repeat className="h-3.5 w-3.5" /> Recurring
                  </div>
                  <p className="text-xs text-muted-foreground">"Check in every 3 months"</p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <div className="flex items-center gap-1.5 text-primary font-semibold mb-0.5 text-xs">
                    <Tag className="h-3.5 w-3.5" /> Tag-Based
                  </div>
                  <p className="text-xs text-muted-foreground">"Follow up weekly with 'cold outreach'"</p>
                </div>
              </section>

              <section className="bg-muted rounded-lg p-2.5">
                <p className="font-semibold text-foreground text-xs mb-0.5">💡 Quick Tips</p>
                <ul className="list-disc pl-4 space-y-0.5 text-xs">
                  <li>Add reminders when messaging someone new</li>
                  <li>Use notes for context like "ask about podcast"</li>
                  <li>Progress matters more than perfection</li>
                </ul>
              </section>
            </>
          ) : (
            // Full desktop version
            <>
              <section className="space-y-2">
                <p className="font-medium text-foreground">How to Use Ripple's Reminders to Stay Consistent</p>
                <p>Networking doesn't have to feel overwhelming. Ripple's reminders act like a gentle coach so you remember to follow up, re-engage, and prep with confidence.</p>
              </section>

              <section>
                <p className="font-semibold text-foreground mb-2">🧠 What Are Reminders?</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Attach reminders to contacts, meetings, or goals.</li>
                  <li>Use them to follow up after an initial conversation or when someone goes quiet.</li>
                  <li>Set prep notes before calls so you never scramble last-minute.</li>
                </ul>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                    <Calendar className="h-4 w-4" /> One-time
                  </div>
                  <p className="text-xs text-muted-foreground">"Email Alex next Monday after our info interview."</p>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                    <Repeat className="h-4 w-4" /> Recurring
                  </div>
                  <p className="text-xs text-muted-foreground">"Check in with Sarah every 3 months."</p>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                    <Tag className="h-4 w-4" /> Tag-Based
                  </div>
                  <p className="text-xs text-muted-foreground">"Follow up with all 'cold outreach' contacts weekly."</p>
                </div>
              </section>

              <section>
                <p className="font-semibold text-foreground mb-2">✨ Tips for Getting the Most Out of Reminders</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Add a reminder whenever you message someone new—"follow up in 5 days" is plenty.</li>
                  <li>Schedule recurring check-ins for priority contacts so relationships don't fade.</li>
                  <li>Use reminder notes for context like "ask about their podcast" or "they're hiring soon."</li>
                  <li>Progress matters more than perfection—if you miss one, just hop back in.</li>
                </ul>
              </section>

              <section className="bg-muted rounded-xl p-4">
                <p className="font-semibold text-foreground mb-1">🚀 Ripple's Goal</p>
                <p>Make networking feel approachable and human. Reminders remove the mental load so you can focus on genuine conversations.</p>
              </section>
            </>
          )}
        </div>

        <div className={`flex ${isMobile ? 'flex-col gap-2 pt-3 border-t flex-shrink-0' : 'flex-row md:justify-between gap-3 pt-4'}`}>
          <Button 
            variant="ghost" 
            onClick={handleNeverShow} 
            className={`${isMobile ? 'w-full text-xs h-9' : 'w-full md:w-auto'}`}
          >
            Don't show again
          </Button>
          <Button 
            onClick={handleClose} 
            className={`${isMobile ? 'w-full text-xs h-9' : 'w-full md:w-auto'}`}
          >
            I got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
