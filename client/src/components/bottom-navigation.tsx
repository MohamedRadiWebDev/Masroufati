import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Home, PieChart, List, Target } from "lucide-react";

interface BottomNavigationProps {
  activeTab: 'home' | 'analytics' | 'transactions' | 'goals';
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    { id: 'home', icon: Home, label: 'الرئيسية', path: '/' },
    { id: 'analytics', icon: PieChart, label: 'التحليلات', path: '/analytics' },
    { id: 'transactions', icon: List, label: 'العمليات', path: '/transactions' },
    { id: 'goals', icon: Target, label: 'الأهداف', path: '/goals' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex-1 flex-col p-4 h-auto ${
                isActive
                  ? 'text-primary border-t-2 border-primary'
                  : 'text-muted-foreground'
              }`}
              onClick={() => setLocation(item.path)}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
