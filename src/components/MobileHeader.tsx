import { useState } from 'react';
import { Menu, X, Home, CreditCard, Target, TrendingUp, Receipt, Settings, PiggyBank, Folders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useNavigate, useLocation } from 'react-router-dom';

const navigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/transacoes', label: 'Transações', icon: Receipt },
  { path: '/movimentacoes', label: 'Movimentações', icon: TrendingUp },
  { path: '/cartoes', label: 'Cartões', icon: CreditCard },
  { path: '/contas', label: 'Contas', icon: PiggyBank },
  { path: '/categorias', label: 'Categorias', icon: Folders },
  { path: '/metas', label: 'Metas', icon: Target },
  { path: '/projecao-fluxo', label: 'Projeção de Fluxo', icon: TrendingUp },
];

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  children?: React.ReactNode;
}

export const MobileHeader = ({ 
  title, 
  showBackButton = false, 
  onBackClick,
  children 
}: MobileHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-primary">Finance Sync</h2>
              </div>
              <nav className="p-4 space-y-2">
                {navigationItems.map(({ path, label, icon: Icon }) => (
                  <Button
                    key={path}
                    variant={location.pathname === path ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleNavigation(path)}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {label}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Title */}
          <h1 className="text-lg sm:text-xl font-bold text-primary truncate max-w-[200px] sm:max-w-none">
            {title}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {children}
        </div>
      </div>
    </header>
  );
};