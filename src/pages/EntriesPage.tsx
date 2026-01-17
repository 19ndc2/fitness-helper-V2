import { useState, useEffect } from 'react';
import { Plus, BookOpen, Trash2, Edit2, Check, X, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/use-toast';
import type { Entry } from '@/services/api';
import { getEntries, createEntry, updateEntry, deleteEntry } from '@/services/api';

export default function EntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await getEntries();
      setEntries(data);
    } catch (error) {
      toast({
        title: 'Error loading entries',
        description: error instanceof Error ? error.message : 'Failed to load entries',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntryContent.trim()) return;
    setIsSaving(true);
    try {
      const newEntry = await createEntry(newEntryContent.trim());
      setEntries([newEntry, ...entries]);
      setNewEntryContent('');
      setIsAdding(false);
      toast({ title: 'Entry saved!', description: 'Great workout logged.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save entry',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEntry = async (id: string) => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updateEntry(id, editContent.trim());
      setEntries(entries.map((e) => (e.id === id ? updated : e)));
      setEditingId(null);
      toast({ title: 'Entry updated!' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update entry',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteEntry(id);
      setEntries(entries.filter((e) => e.id !== id));
      toast({ title: 'Entry deleted' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete entry',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (entry: Entry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'short' }),
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="pb-4">
      <PageHeader title="Entries" subtitle="Log your workouts" />

      <div className="p-4 space-y-4">
        {/* Add Entry Section */}
        {isAdding ? (
          <Card className="animate-fade-in border-primary/50">
            <CardContent className="pt-4">
              <Textarea
                placeholder="What did you do today? e.g., '30 min run, 5K total. Felt strong on the hills!'"
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                className="min-h-[120px] resize-none"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <Button onClick={handleAddEntry} disabled={isSaving || !newEntryContent.trim()}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span className="ml-2">Save Entry</span>
                </Button>
                <Button variant="ghost" onClick={() => setIsAdding(false)}>
                  <X className="w-4 h-4" />
                  <span className="ml-2">Cancel</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setIsAdding(true)} className="w-full gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Log Workout
          </Button>
        )}

        {/* Entries List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No entries yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Log your first workout to start tracking
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => {
              const { day, date, time } = formatDate(entry.createdAt);
              return (
                <Card
                  key={entry.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="pt-4">
                    {editingId === entry.id ? (
                      <>
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[100px] resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateEntry(entry.id)}
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
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center text-center min-w-[50px]">
                          <span className="text-xs text-muted-foreground uppercase">{day}</span>
                          <span className="text-lg font-bold text-primary">{date.split(' ')[1]}</span>
                          <span className="text-xs text-muted-foreground">{date.split(' ')[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0 border-l border-border pl-3">
                          <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {time}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEditing(entry)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
