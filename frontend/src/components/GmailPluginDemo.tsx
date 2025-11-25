import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, CheckCircle2, Zap } from "lucide-react";
import { useFeatureUnlock } from "@/hooks/useFeatureUnlock";

export const GmailPluginDemo = () => {
  const { experienceLevel } = useFeatureUnlock();

  // Only show for beginners
  if (experienceLevel !== "beginner") {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Gmail Plugin (Coming Soon)</CardTitle>
        </div>
        <CardDescription>
          Automatically log emails and interactions directly from Gmail
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-sm">How it works:</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Install the Ripple Gmail extension</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Emails are automatically logged to your contacts</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Interactions are tracked without manual entry</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Follow-up reminders are set automatically</span>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Example:</p>
              <p>
                When you send an email to a contact, Ripple will automatically:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 ml-2">
                <li>Log the interaction in your contact's history</li>
                <li>Extract key information (subject, date, participants)</li>
                <li>Suggest a follow-up reminder date</li>
                <li>Update relationship health metrics</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled>
            <Mail className="h-4 w-4 mr-2" />
            Install Extension
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Available soon for Intermediate and Advanced users
        </p>
      </CardContent>
    </Card>
  );
};

