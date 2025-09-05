import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, QrCode, ShoppingCart, Scale, CreditCard, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartItemCount: number;
}

const Navigation = ({ activeTab, onTabChange, cartItemCount }: NavigationProps) => {
  const tabs = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'scan', name: 'Scan', icon: QrCode },
    { id: 'cart', name: 'Cart', icon: ShoppingCart },
    { id: 'weight', name: 'Weight', icon: Scale },
    { id: 'auth', name: 'Login', icon: Settings },
    { id: 'admin', name: 'Admin', icon: Settings },
  ];

  return (
    <nav className="bg-smartcart-surface border-b border-border p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => onTabChange(tab.id)}
                className="relative min-h-touch flex-1 min-w-24 md:min-w-32 flex flex-col gap-1 p-2 md:p-3"
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-xs md:text-sm font-medium">{tab.name}</span>
                {tab.id === 'cart' && cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-smartcart-danger text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;