import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, ClipboardList, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/inventory', icon: Package, label: 'Stock' },
  { to: '/sales', icon: ShoppingCart, label: 'Sales' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/profile', icon: User, label: 'Profile' },
  
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || 
            (to !== '/' && location.pathname.startsWith(to));
          
          return (
            <RouterNavLink
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-primary/10' : ''
              }`}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </RouterNavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
