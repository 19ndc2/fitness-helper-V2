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
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await getGoals();
      setGoal(data);
    } catch (error) {
      toast({
        title: 'Error loading goal',
        description: error instanceof Error ? error.message : 'Failed to load goal',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!editText.trim()) return;
    setIsSaving(true);
    try {
      const newGoal = await createGoal(editText.trim());
      setGoal(newGoal);
      setEditText('');
      setIsEditing(false);
      toast({ title: 'Goal set!', description: 'Keep pushing towards your goal.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set goal',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!goal || !editText.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updateGoal(goal.id, editText.trim());
      setGoal(updated);
      setIsEditing(false);
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

  const handleDeleteGoal = async () => {
    if (!goal) return;
    try {
      await deleteGoal(goal.id);
      setGoal(null);
      toast({ title: 'Goal cleared' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete goal',
        variant: 'destructive',
      });
    }
  };

  const startEditing = () => {
    if (goal) {
      setEditText(goal.text);
      setIsEditing(true);
    } else {
      setEditText('');
      setIsEditing(true);
    }
  };

  return (
    <div className="pb-4">
      <PageHeader title="Your Goal" subtitle="Set your fitness target" showLogout />

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isEditing ? (
          <Card className="animate-fade-in">
            <CardContent className="pt-4">
              <Textarea
                placeholder="What's your fitness goal? e.g., 'Run a 5K in under 25 minutes'"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[100px] resize-none"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <Button onClick={handleAddGoal} disabled={isSaving || !editText.trim()}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span className="ml-2">{goal ? 'Update' : 'Save'}</span>
                </Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" />
                  <span className="ml-2">Cancel</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : goal ? (
          <Card className="animate-slide-up">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{goal.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set on {new Date(goal.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => startEditing()}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={handleDeleteGoal}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No goal set yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set your first fitness goal to get started
            </p>
            <Button onClick={() => startEditing()} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Set Your Goal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
