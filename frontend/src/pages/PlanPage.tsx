import { useState, useEffect } from 'react';
import { Sparkles, Calendar, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/use-toast';
import type { FitnessPlan } from '@/services/api';
import { getFitnessPlan } from '@/services/api';

export default function PlanPage() {
  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const data = await getFitnessPlan();
      setPlan(data);
    } catch (error) {
      toast({
        title: 'Error loading plan',
        description: error instanceof Error ? error.message : 'Failed to load fitness plan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse plan content - assuming it's markdown or structured text
  const renderPlanContent = (content: string) => {
    // Simple markdown-ish rendering
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-primary">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h4 key={i} className="text-base font-semibold mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 text-sm text-muted-foreground">
            {line.replace('- ', '')}
          </li>
        );
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return (
        <p key={i} className="text-sm text-foreground">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="pb-4">
      <PageHeader title="AI Plan" subtitle="Your personalized fitness plan" />

      <div className="p-4 space-y-4">

        {/* Plan Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : plan ? (
          <Card className="animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Your Fitness Plan
                </CardTitle>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(plan.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {renderPlanContent(plan.content)}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No plan yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">
              Generate an AI-powered fitness plan based on your goals and workout entries
            </p>
          </div>
        )}

        {/* Tips */}
        {!plan && !isLoading && (
          <Card className="bg-secondary/50">
            <CardContent className="pt-4">
              <h4 className="font-medium text-sm mb-2">💡 Pro Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Add goals to help the AI understand what you want to achieve</li>
                <li>• Log workout entries so the AI can track your progress</li>
                <li>• The more data you provide, the better your plan will be</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
