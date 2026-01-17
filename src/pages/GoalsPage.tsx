import { useState, useEffect } from 'react';
import { Plus, Target, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/use-toast';
import type { Goal } from '@/services/api';
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/services/api';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (error) {
      toast({
        title: 'Error loading goals',
        description: error instanceof Error ? error.message : 'Failed to load goals',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalText.trim()) return;
    setIsSaving(true);
    try {
      const newGoal = await createGoal(newGoalText.trim());
      setGoals([newGoal, ...goals]);
      setNewGoalText('');
      setIsAdding(false);
      toast({ title: 'Goal added!', description: 'Keep pushing towards your goals.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add goal',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGoal = async (id: string) => {
    if (!editText.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updateGoal(id, editText.trim());
      setGoals(goals.map((g) => (g.id === id ? updated : g)));
      setEditingId(null);
      toast({ title: 'Goal updated!' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update goal',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteGoal(id);
      setGoals(goals.filter((g) => g.id !== id));
      toast({ title: 'Goal removed' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete goal',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (goal: Goal) => {
    setEditingId(goal.id);
    setEditText(goal.text);
  };

  return (
    <div className="pb-4">
      <PageHeader title="Goals" subtitle="Set your fitness targets" showLogout />

      <div className="p-4 space-y-4">
        {/* Add Goal Section */}
        {isAdding ? (
          <Card className="animate-fade-in">
            <CardContent className="pt-4">
              <Textarea
                placeholder="What's your fitness goal? e.g., 'Run a 5K in under 25 minutes'"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                className="min-h-[100px] resize-none"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <Button onClick={handleAddGoal} disabled={isSaving || !newGoalText.trim()}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span className="ml-2">Save</span>
                </Button>
                <Button variant="ghost" onClick={() => setIsAdding(false)}>
                  <X className="w-4 h-4" />
                  <span className="ml-2">Cancel</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setIsAdding(true)} className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add New Goal
          </Button>
        )}

        {/* Goals List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No goals yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first fitness goal to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal, index) => (
              <Card
                key={goal.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="pt-4">
                  {editingId === goal.id ? (
                    <>
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[80px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateGoal(goal.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{goal.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(goal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEditing(goal)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
