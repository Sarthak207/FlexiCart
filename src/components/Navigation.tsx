import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Scan, Home, Scale, CreditCard, Settings, LogOut, User, BarChart3, Map } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface NavigationProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  cartItemsCount: number;
  user: SupabaseUser | null;
}

const Navigation = ({ currentTab, onNavigate, cartItemsCount, user }: NavigationProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onNavigate('home');
    setShowUserMenu(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center gap-1 md:gap-2">
          <Button
            variant={currentTab === 'home' ? 'default' : 'ghost'}
            onClick={() => onNavigate('home')}
            className="min-h-touch"
          >
            <Home className="h-5 w-5 mr-2" />
            Home
          </Button>
          
          <Button
            variant={currentTab === 'scan' ? 'default' : 'ghost'}
            onClick={() => onNavigate('scan')}
            className="min-h-touch"
          >
            <Scan className="h-5 w-5 mr-2" />
            Scan
          </Button>
          
          <Button
            variant={currentTab === 'cart' ? 'default' : 'ghost'}
            onClick={() => onNavigate('cart')}
            className="min-h-touch relative"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Cart
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                {cartItemsCount}
              </span>
            )}
          </Button>

          {user && (
            <>
              <Button
                variant={currentTab === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => onNavigate('dashboard')}
                className="min-h-touch"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Dashboard
              </Button>

              <Button
                variant={currentTab === 'store-map' ? 'default' : 'ghost'}
                onClick={() => onNavigate('store-map')}
                className="min-h-touch"
              >
                <Map className="h-5 w-5 mr-2" />
                Map
              </Button>
            </>
          )}

          {user ? (
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="min-h-touch"
              >
                <User className="h-5 w-5 mr-2" />
                Account
              </Button>
              
              {showUserMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-background border rounded-lg shadow-lg p-2 min-w-48">
                  <div className="px-3 py-2 text-sm border-b">
                    {user.email}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onNavigate('admin');
                      setShowUserMenu(false);
                    }}
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant={currentTab === 'auth' ? 'default' : 'ghost'}
              onClick={() => onNavigate('auth')}
              className="min-h-touch"
            >
              <User className="h-5 w-5 mr-2" />
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;