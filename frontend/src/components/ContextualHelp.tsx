import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Users, Bell, Target, Zap, TrendingUp, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { contactsApi, goalsApi } from "@/lib/api";

interface ContextualHelpProps {
  onDismiss?: () => void;
}

export const ContextualHelp = ({ onDismiss }: ContextualHelpProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [helpTip, setHelpTip] = useState<string | null>(null);
  const [helpAction, setHelpAction] = useState<{ label: string; onClick: () => void } | null>(null);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.userId || !user?.experience_level) return;

    const loadContextualHelp = async () => {
      try {
        // Check user's current state
        const [contactsData, goalsData] = await Promise.all([
          contactsApi.getContacts(user.userId),
          goalsApi.getGoals(user.userId),
        ]);

        const contacts = Array.isArray(contactsData) ? contactsData : [];
        const goals = Array.isArray(goalsData) ? goalsData : [];

        // Generate contextual help based on experience level and activity
        if (user.experience_level === 'beginner') {
          // Beginner: Frequent prompts for basic actions
          if (contacts.length === 0) {
            const tipKey = 'beginner-add-contact';
            if (!dismissedTips.has(tipKey)) {
              setHelpTip("Start building your network! Add your first contact to get started.");
              setHelpAction({
                label: "Add Contact",
                onClick: () => navigate('/contacts'),
              });
              return;
            }
          }

          if (contacts.length > 0 && goals.length === 0) {
            const tipKey = 'beginner-set-goal';
            if (!dismissedTips.has(tipKey)) {
              setHelpTip("Great start! Now set your first networking goal to stay on track.");
              setHelpAction({
                label: "Set Goal",
                onClick: () => navigate('/goals'),
              });
              return;
            }
          }

          if (contacts.length > 0 && goals.length > 0) {
            // Check if any contacts have reminders
            const hasReminders = contacts.some((c: any) => c.date_next_follow_up);
            if (!hasReminders) {
              const tipKey = 'beginner-set-reminder';
              if (!dismissedTips.has(tipKey)) {
                setHelpTip("Set a reminder to follow up with your contacts. Consistency is key!");
                setHelpAction({
                  label: "Set Reminder",
                  onClick: () => navigate('/reminders'),
                });
                return;
              }
            }
          }
        } else if (user.experience_level === 'intermediate') {
          // Intermediate: Suggest efficiency features
          if (contacts.length > 5 && goals.length === 0) {
            const tipKey = 'intermediate-set-goal';
            if (!dismissedTips.has(tipKey)) {
              setHelpTip("You have several contacts! Set a goal to track your networking progress.");
              setHelpAction({
                label: "Create Goal",
                onClick: () => navigate('/goals'),
              });
              return;
            }
          }

          // Suggest using templates if they have contacts but no recent interactions
          const tipKey = 'intermediate-use-templates';
          if (!dismissedTips.has(tipKey) && contacts.length > 3) {
            setHelpTip("Use email templates to make your outreach faster and more consistent.");
            setHelpAction({
              label: "View Templates",
              onClick: () => navigate('/contacts'),
            });
            return;
          }
        } else if (user.experience_level === 'advanced') {
          // Experienced: Suggest advanced features
          const tipKey = 'advanced-analytics';
          if (!dismissedTips.has(tipKey) && contacts.length > 10) {
            setHelpTip("Track your networking metrics and relationship health with advanced analytics.");
            setHelpAction({
              label: "View Analytics",
              onClick: () => navigate('/progress'),
            });
            return;
          }

          // Suggest bulk actions
          const bulkTipKey = 'advanced-bulk-actions';
          if (!dismissedTips.has(bulkTipKey) && contacts.length > 20) {
            setHelpTip("Use bulk actions to efficiently manage multiple contacts and goals.");
            setHelpAction({
              label: "Explore Features",
              onClick: () => navigate('/dashboard'),
            });
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load contextual help:", error);
      }
    };

    loadContextualHelp();
  }, [user, dismissedTips, navigate]);

  const handleDismiss = () => {
    if (helpTip) {
      // Generate a unique key for this tip
      const tipKey = `${user?.experience_level}-${helpTip.substring(0, 20)}`;
      const newDismissed = new Set(dismissedTips);
      newDismissed.add(tipKey);
      setDismissedTips(newDismissed);
      
      // Store in localStorage
      localStorage.setItem('dismissedContextualTips', JSON.stringify(Array.from(newDismissed)));
    }
    setHelpTip(null);
    setHelpAction(null);
    onDismiss?.();
  };

  // Load dismissed tips from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dismissedContextualTips');
    if (stored) {
      try {
        setDismissedTips(new Set(JSON.parse(stored)));
      } catch (error) {
        console.error("Failed to load dismissed tips:", error);
      }
    }
  }, []);

  if (!helpTip || !user?.experience_level) return null;

  const getIcon = () => {
    if (helpTip.includes('contact')) return Users;
    if (helpTip.includes('goal')) return Target;
    if (helpTip.includes('reminder')) return Bell;
    if (helpTip.includes('template')) return Mail;
    if (helpTip.includes('analytics')) return TrendingUp;
    return Zap;
  };

  const Icon = getIcon();

  return (
    <Card className="border-primary/50 bg-primary/5 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-2">{helpTip}</p>
            {helpAction && (
              <Button
                size="sm"
                onClick={() => {
                  helpAction.onClick();
                  handleDismiss();
                }}
                className="bg-primary hover:bg-primary/90"
              >
                {helpAction.label}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

