import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { dashboardApi, authApi, formatCurrency } from '@/lib/api';
import type { DashboardStats } from '@/types';
import { TrendingUp, DollarSign, ShoppingBag, AlertTriangle, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  iconBg 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  iconBg: string;
}) => (
  <div className="bg-card rounded-2xl p-4 shadow-card animate-scale-in">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = authApi.getUser();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card rounded-2xl p-4 shadow-card animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-5 w-28 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`Hi, ${user?.name || 'Boss'} 👋`}
      subtitle="Jossy-Diva Collections"
      headerRight={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      }
    >
      {/* Today's Stats */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Today's Overview
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={DollarSign}
            label="Total Sales"
            value={formatCurrency(stats?.todaySales || 0)}
            iconBg="bg-success-light text-success"
          />
          <StatCard
            icon={TrendingUp}
            label="Profit"
            value={formatCurrency(stats?.todayProfit || 0)}
            iconBg="bg-info-light text-info"
          />
          <StatCard
            icon={ShoppingBag}
            label="Transactions"
            value={String(stats?.todayTransactions || 0)}
            iconBg="bg-gold-light text-gold-foreground"
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={String(stats?.lowStockItems?.length || 0)}
            iconBg="bg-warning-light text-warning"
          />
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStockItems && stats.lowStockItems.length > 0 && (
        <div className="animate-fade-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            ⚠️ Low Stock Alert
          </h2>
          <div className="space-y-2">
            {stats.lowStockItems.map(item => (
              <div
                key={item.id}
                className="bg-card rounded-xl p-3 shadow-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning-light">
                    <Package className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-warning">{item.quantity} left</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.sellingPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          onClick={() => navigate('/sales')}
          className="h-14 rounded-xl gradient-gold text-accent-foreground font-semibold hover:opacity-90"
        >
          <ShoppingBag className="h-5 w-5 mr-2" />
          New Sale
        </Button>
        <Button
          onClick={() => navigate('/inventory')}
          variant="outline"
          className="h-14 rounded-xl font-semibold border-2"
        >
          <Package className="h-5 w-5 mr-2" />
          Add Stock
        </Button>
      </div>
    </Layout>
  );
};

export default Dashboard;
