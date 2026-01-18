import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
}

export function PageHeader({ title, subtitle, showLogout = false }: PageHeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="flex items-center justify-between h-16 px-4">
        <div>
          <h1 className="text-xl font-bold text-gradient">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showLogout && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
