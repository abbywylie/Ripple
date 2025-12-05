import { CheckCircle2, Circle, ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

export interface TimelineStage {
  stage: string;
  completed: boolean;
  timestamp: string | null;
  notes: string | null;
}

interface ContactTimelineProps {
  timeline: TimelineStage[];
  currentStage: string | null;
  onStageUpdate?: (stage: string, completed: boolean, notes?: string) => void;
}

const DEFAULT_STAGES = [
  "Outreach Sent",
  "Response Received",
  "Meeting Scheduled",
  "Meeting Completed",
  "Follow-Up Sent",
  "Ongoing Contact"
];

export const ContactTimeline = ({ timeline, currentStage, onStageUpdate }: ContactTimelineProps) => {
  // Merge timeline with default stages
  const stages = DEFAULT_STAGES.map(stageName => {
    const timelineEntry = timeline?.find(t => t.stage === stageName);
    return {
      stage: stageName,
      completed: timelineEntry?.completed || false,
      timestamp: timelineEntry?.timestamp || null,
      notes: timelineEntry?.notes || null
    };
  });

  const getStageIndex = (stage: string) => DEFAULT_STAGES.indexOf(stage);
  const isCurrentStage = (stage: string) => stage === currentStage;
  const isCompleted = (stage: string) => {
    const entry = stages.find(s => s.stage === stage);
    return entry?.completed || false;
  };

  const handleNextStage = (currentIndex: number) => {
    if (currentIndex < DEFAULT_STAGES.length - 1) {
      const nextStage = DEFAULT_STAGES[currentIndex + 1];
      onStageUpdate?.(nextStage, true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Relationship Timeline</h3>
        {currentStage && (
          <Badge variant="outline" className="text-primary border-primary">
            Current: {currentStage}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isComplete = stage.completed;
          const isCurrent = isCurrentStage(stage.stage);
          const canAdvance = index === 0 || stages[index - 1]?.completed;

          return (
            <Card 
              key={stage.stage} 
              className={`transition-all ${
                isComplete 
                  ? 'border-green-200 bg-green-50/50' 
                  : isCurrent 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'border-border/50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Stage Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                  </div>

                  {/* Stage Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-medium ${isComplete ? 'text-green-900' : isCurrent ? 'text-primary' : 'text-foreground'}`}>
                        {stage.stage}
                      </h4>
                      {stage.timestamp && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(stage.timestamp), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    
                    {stage.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{stage.notes}</p>
                    )}

                    {!isComplete && canAdvance && onStageUpdate && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => handleNextStage(index - 1)}
                      >
                        Mark as Complete
                      </Button>
                    )}
                  </div>

                  {/* Arrow */}
                  {index < stages.length - 1 && (
                    <div className="flex-shrink-0 mt-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};


