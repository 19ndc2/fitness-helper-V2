import { NavLink, useLocation } from 'react-router-dom';
import { Target, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/entries', icon: BookOpen, label: 'Entries' },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'animate-pulse')} />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
