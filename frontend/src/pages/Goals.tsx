import { Target, Plus, TrendingUp, Calendar, CheckCircle2, Edit, Trash2, CheckCircle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { goalsApi } from "@/lib/api";
import { useEffect, useState } from "react";

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_value: 1,
    current_value: 0,
    deadline: '',
    status: 'In Progress'
  });

  // Load goals from API
  useEffect(() => {
    const loadGoals = async () => {
      if (user?.userId) {
        try {
          const goalsData = await goalsApi.getGoals(user.userId);
          await removeCompletedGoals(goalsData);
        } catch (error) {
          console.error('Failed to load goals:', error);
          setGoals([]);
        }
      }
      setLoading(false);
    };

    if (user) {
      loadGoals();
    } else {
      setLoading(false);
    }
  }, [user?.userId, user]);

  // Create new goal
  const handleCreateGoal = async () => {
    if (!user?.userId || !newGoal.title.trim()) return;

    try {
      const goalData = {
        user_id: user.userId,
        title: newGoal.title,
        description: newGoal.description || undefined,
        target_value: newGoal.target_value,
        current_value: newGoal.current_value,
        deadline: newGoal.deadline || undefined,
        status: newGoal.status,
      };

      await goalsApi.createGoal(goalData);
      
      // Reload goals
      const updatedGoals = await goalsApi.getGoals(user.userId);
      await removeCompletedGoals(updatedGoals);
      
      // Reset form and close dialog
      setNewGoal({
        title: '',
        description: '',
        target_value: 1,
        current_value: 0,
        deadline: '',
        status: 'In Progress'
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  // Edit goal
  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setIsEditDialogOpen(true);
  };

  const handleUpdateGoal = async () => {
    if (!user?.userId || !editingGoal?.title?.trim()) return;

    try {
      const goalData = {
        goal_id: editingGoal.goal_id,
        user_id: user.userId,
        title: editingGoal.title,
        description: editingGoal.description || undefined,
        target_value: editingGoal.target_value,
        current_value: editingGoal.current_value,
        deadline: editingGoal.deadline || undefined,
        status: editingGoal.status,
      };

      await goalsApi.updateGoal(goalData);
      
      // Reload goals
      const updatedGoals = await goalsApi.getGoals(user.userId);
      await removeCompletedGoals(updatedGoals);
      
      // Close dialog and reset state
      setIsEditDialogOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goal: any) => {
    if (!user?.userId) return;

    try {
      await goalsApi.deleteGoal({
        goal_id: goal.goal_id,
        user_id: user.userId
      });
      
      // Reload goals
      const updatedGoals = await goalsApi.getGoals(user.userId);
      await removeCompletedGoals(updatedGoals);
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };


  // Toggle goal step completion
  const handleToggleStep = async (goal: any, step: any) => {
    if (!user?.userId) return;

    try {
      await goalsApi.updateGoalStep({
        step_id: step.step_id,
        completed: !step.completed,
      });
      
      // Reload goals to get updated steps
      const updatedGoals = await goalsApi.getGoals(user.userId);
      await removeCompletedGoals(updatedGoals);
    } catch (error) {
      console.error('Failed to toggle step:', error);
    }
  };

  // Add new step to goal
  const handleAddStep = async (goal: any, stepTitle: string) => {
    if (!user?.userId || !stepTitle.trim()) return;

    try {
      const currentSteps = goal.steps || [];
      await goalsApi.createGoalStep({
        goal_id: goal.goal_id,
        title: stepTitle.trim(),
        order_index: currentSteps.length,
      });
      
      // Reload goals
      const updatedGoals = await goalsApi.getGoals(user.userId);
      await removeCompletedGoals(updatedGoals);
    } catch (error) {
      console.error('Failed to add step:', error);
    }
  };

  // Calculate progress percentage based on completed steps or explicit status
  const calculateProgress = (goal: any) => {
    const steps = goal.steps || [];
    if (goal.status === 'Completed') return 100;
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter((step: any) => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

<<<<<<< HEAD
  // Auto-mark goal as completed when progress reaches 100%
  useEffect(() => {
    const markCompletedGoals = async () => {
      if (!user?.userId) return;

      const toComplete = goals.filter((g) => {
        const progress = calculateProgress(g);
        return g.status !== 'Completed' && progress === 100;
      });

      if (toComplete.length === 0) return;

      await Promise.allSettled(
        toComplete.map((goal) =>
          goalsApi.updateGoal({
            goal_id: goal.goal_id,
            user_id: user.userId,
            status: 'Completed',
          })
        )
      );

      // Refresh after updates
      const refreshed = await goalsApi.getGoals(user.userId);
      setGoals(refreshed);
    };

    markCompletedGoals();
  }, [goals, user?.userId]);

  // Derived completion state so UI can reflect accomplished goals even if status wasn't manually updated
  const isGoalCompleted = (goal: any) => calculateProgress(goal) === 100;

  // Remove completed goals from the list (auto-cleanup) and keep UI in sync
  const removeCompletedGoals = async (goalsList: any[]) => {
    if (!user?.userId) {
      setGoals(goalsList);
      return;
    }

    const completed = goalsList.filter((g) => isGoalCompleted(g));
    if (completed.length === 0) {
      setGoals(goalsList);
      return;
    }

    // Delete completed goals
    await Promise.allSettled(
      completed.map((goal) =>
        goalsApi.deleteGoal({
          goal_id: goal.goal_id,
          user_id: user.userId,
        })
      )
    );

    // Refresh list after deletion
    const refreshed = await goalsApi.getGoals(user.userId);
    setGoals(refreshed);
  };

  // Calculate stats
  const activeGoalsCount = goals.filter(g => !isGoalCompleted(g)).length;
  const completedGoalsCount = goals.filter(g => isGoalCompleted(g)).length;
  const averageCompletion = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + calculateProgress(goal), 0) / goals.length)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700 border-green-300";
      case "In Progress": return "bg-primary/20 text-primary border-primary/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Handle case when user is not logged in
  if (!user && !loading) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-2">Networking Goals</h1>
          <p className="text-muted-foreground">Please log in to view your goals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Networking Goals</h1>
          <p className="text-muted-foreground">Track your relationship building objectives</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter goal title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter goal description"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target_value" className="text-right">
                  Target Value
                </Label>
                <div className="col-span-3">
                  <Input
                    id="target_value"
                    type="number"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({...newGoal, target_value: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional: Progress is tracked by goal steps below</p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deadline" className="text-right">
                  Deadline
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGoal} disabled={!newGoal.title.trim()}>
                Add Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{loading ? "..." : activeGoalsCount}</div>
                <div className="text-sm text-muted-foreground">Active Goals</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold">{loading ? "..." : `${averageCompletion}%`}</div>
                <div className="text-sm text-muted-foreground">Avg. Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{loading ? "..." : completedGoalsCount}</div>
                <div className="text-sm text-muted-foreground">Goals Achieved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">Start setting networking goals to track your progress</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Goal
            </Button>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal);
            const completed = isGoalCompleted(goal);
            const statusLabel = completed ? 'Completed' : (goal.status || 'In Progress');
            const steps = goal.steps || [];
            const completedSteps = steps.filter((step: any) => step.completed).length;
            return (
              <Card 
                key={goal.goal_id} 
                className={`glass-card border-border/50 hover:border-primary/50 transition-all ${completed ? 'opacity-80' : ''}`}
              >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className={`text-xl mb-2 ${completed ? 'line-through text-muted-foreground' : ''}`}>
                    {goal.title}
                  </CardTitle>
                      <p className={`text-sm text-muted-foreground ${completed ? 'line-through' : ''}`}>
                        {goal.description || 'No description provided'}
                      </p>
                </div>
                    <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusColor(statusLabel)}>
                  {statusLabel}
                </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditGoal(goal)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{goal.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteGoal(goal)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar Based on Steps */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    {steps.length === 0 
                      ? "No steps yet - add steps below to track progress" 
                      : `${completedSteps} of ${steps.length} steps completed`
                    }
                  </span>
                  {steps.length > 0 && (
                    <span className="text-sm text-accent font-semibold">{progress}%</span>
                  )}
                </div>
                {steps.length > 0 && (
                  <Progress value={progress} className="h-2 mb-3" />
                )}
              </div>

              {/* Goal Steps/Checklist */}
              {goal.steps && goal.steps.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                    Goal Steps ({goal.steps.filter((step: any) => step.completed).length}/{goal.steps.length} completed)
                </div>
                <div className="space-y-2">
                    {goal.steps
                      .sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((step: any) => (
                      <div key={step.step_id} className="flex items-center gap-3 text-sm">
                        <button
                          onClick={() => handleToggleStep(goal, step)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            step.completed 
                              ? 'bg-primary text-primary-foreground' 
                              : 'border-2 border-border hover:border-primary'
                          }`}
                        >
                          {step.completed && <CheckCircle className="h-3 w-3" />}
                        </button>
                        <span className={`flex-1 ${step.completed ? 'text-muted-foreground line-through' : ''}`}>
                          {step.title}
                        </span>
                      </div>
                    ))}
                  </div>
                    </div>
              )}

              {/* Add Step Input */}
              <div className="border-t border-border/50 pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a step..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        handleAddStep(goal, input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                      if (input?.value) {
                        handleAddStep(goal, input.value);
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border/50">
                <Calendar className="h-4 w-4" />
                <span>Deadline: {goal.deadline || 'No deadline set'}</span>
              </div>
            </CardContent>
          </Card>
            );
          })
        )}
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">
                  Title *
                </Label>
                <Input
                  id="edit-title"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({...editingGoal, title: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter goal title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingGoal.description || ''}
                  onChange={(e) => setEditingGoal({...editingGoal, description: e.target.value})}
                  className="col-span-3"
                  placeholder="Enter goal description"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-target_value" className="text-right">
                  Target
                </Label>
                <Input
                  id="edit-target_value"
                  type="number"
                  value={editingGoal.target_value}
                  onChange={(e) => setEditingGoal({...editingGoal, target_value: parseInt(e.target.value) || 1})}
                  className="col-span-3"
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-current_value" className="text-right">
                  Current
                </Label>
                <Input
                  id="edit-current_value"
                  type="number"
                  value={editingGoal.current_value}
                  onChange={(e) => setEditingGoal({...editingGoal, current_value: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-deadline" className="text-right">
                  Deadline
                </Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={editingGoal.deadline ? editingGoal.deadline.split('T')[0] : ''}
                  onChange={(e) => setEditingGoal({...editingGoal, deadline: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <select
                  id="edit-status"
                  value={editingGoal.status}
                  onChange={(e) => setEditingGoal({...editingGoal, status: e.target.value})}
                  className="col-span-3 px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingGoal(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGoal} disabled={!editingGoal?.title?.trim()}>
              Update Goal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
