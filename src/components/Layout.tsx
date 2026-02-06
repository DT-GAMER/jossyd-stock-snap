import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
}

const Layout = ({ children, title, subtitle, headerRight }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {headerRight && <div>{headerRight}</div>}
          </div>
        </header>
      )}

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Layout;
