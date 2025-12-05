import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { TimelineStage } from "./ContactTimeline";

interface ContactChecklistProps {
  timeline: TimelineStage[];
  onToggle?: (stage: string, completed: boolean) => void;
}

const DEFAULT_STAGES = [
  "Outreach Sent",
  "Response Received",
  "Meeting Scheduled",
  "Meeting Completed",
  "Follow-Up Sent",
  "Ongoing Contact"
];

export const ContactChecklist = ({ timeline, onToggle }: ContactChecklistProps) => {
  const stages = DEFAULT_STAGES.map(stageName => {
    const timelineEntry = timeline?.find(t => t.stage === stageName);
    return {
      stage: stageName,
      completed: timelineEntry?.completed || false,
      timestamp: timelineEntry?.timestamp || null,
      notes: timelineEntry?.notes || null
    };
  });

  const completedCount = stages.filter(s => s.completed).length;
  const totalCount = stages.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Checklist</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} completed
        </span>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {stages.map((stage) => (
            <div
              key={stage.stage}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                stage.completed
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-muted/50 hover:bg-muted'
              }`}
              onClick={() => onToggle?.(stage.stage, !stage.completed)}
            >
              {stage.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${stage.completed ? 'text-green-900 line-through' : 'text-foreground'}`}>
                  {stage.stage}
                </p>
                {stage.timestamp && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(stage.timestamp), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};


