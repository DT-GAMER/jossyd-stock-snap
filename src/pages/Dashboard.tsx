import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { dashboardApi, authApi, formatCurrency } from '@/lib/api';
import type { DashboardStats } from '@/types';
import { TrendingUp, DollarSign, ShoppingBag, AlertTriangle, LogOut, Package, ClipboardList, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  iconBg,
  onClick,
}: { 
  icon: any; 
  label: string; 
  value: string; 
  iconBg: string;
  onClick?: () => void;
}) => (
  <div 
    className={`bg-card rounded-2xl p-4 shadow-card animate-scale-in ${onClick ? 'cursor-pointer hover:shadow-card-hover transition-shadow' : ''}`}
    onClick={onClick}
  >
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
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = authApi.getUser();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardApi.getStats();
      console.log('📊 Dashboard stats:', data);
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
            value={formatCurrency(stats?.today.totalSalesAmount || 0)}
            iconBg="bg-success-light text-success"
          />
          <StatCard
            icon={TrendingUp}
            label="Profit"
            value={formatCurrency(stats?.today.totalProfit || 0)}
            iconBg="bg-info-light text-info"
          />
          <StatCard
            icon={ShoppingBag}
            label="Transactions"
            value={String(stats?.today.transactions || 0)}
            iconBg="bg-gold-light text-gold-foreground"
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={String(stats?.lowStockCount || 0)}
            iconBg="bg-warning-light text-warning"
            onClick={() => document.getElementById('low-stock-section')?.scrollIntoView({ behavior: 'smooth' })}
          />
        </div>
      </div>

      {/* Pending Website Orders */}
      {(stats?.pendingOrdersCount ?? 0) > 0 && (
        <div
          className="bg-card rounded-2xl p-4 shadow-card mb-6 animate-fade-in cursor-pointer hover:shadow-card-hover transition-shadow"
          onClick={() => setShowPendingOrders(true)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning-light">
              <ClipboardList className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">Pending Website Orders</p>
              <p className="text-lg font-bold text-foreground">{stats?.pendingOrdersCount}</p>
            </div>
            <span className="text-xs text-info font-semibold">View Details →</span>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {stats?.lowStock && stats.lowStock.length > 0 && (
        <div id="low-stock-section" className="animate-fade-in mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            ⚠️ Low Stock Alert
          </h2>
          <div className="space-y-2">
            {stats.lowStock.map(item => (
              <div
                key={item.id}
                className="bg-card rounded-xl p-3 shadow-card flex items-center justify-between hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning-light">
                    <Package className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-warning">{item.available} left</p>
                  {item.sellingPrice && (
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.sellingPrice)}</p>
                  )}
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

      {/* Pending Orders Detail Dialog */}
      <Dialog open={showPendingOrders} onOpenChange={setShowPendingOrders}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pending Orders</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {stats?.pendingOrders && stats.pendingOrders.length > 0 ? (
              stats.pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card border border-border rounded-xl p-3 cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => {
                    setShowPendingOrders(false);
                    navigate('/orders');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning-light">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No pending orders</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;