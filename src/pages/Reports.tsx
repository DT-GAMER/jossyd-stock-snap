import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { reportsApi, salesApi, formatCurrency } from '@/lib/api';
import type { ReportSummary, Sale } from '@/types';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/types';

type Period = 'daily' | 'weekly' | 'monthly';

const Reports = () => {
  const [period, setPeriod] = useState<Period>('daily');
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReport();
  }, [period]);

  useEffect(() => {
    loadRecentSales();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getSummary(period);
      setReport(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSales = async () => {
    try {
      const sales = await salesApi.getAll();
      setRecentSales(sales.slice(0, 10));
    } catch (err: any) {
      // silent fail for recent sales
    }
  };

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat);
    return found ? `${found.icon} ${found.label}` : cat;
  };

  const periods: { value: Period; label: string }[] = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
  ];

  return (
    <Layout title="Reports" subtitle="Sales performance">
      {/* Period Tabs */}
      <div className="flex gap-2 mb-5">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              period === p.value
                ? 'gradient-brand text-primary-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-2" />
              <div className="h-6 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : report ? (
        <div className="space-y-5 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <DollarSign className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Sales</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(report.totalSales)}</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <TrendingUp className="h-5 w-5 text-info mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Profit</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(report.totalProfit)}</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <ShoppingBag className="h-5 w-5 text-gold mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Orders</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{report.totalTransactions}</p>
            </div>
          </div>

          {/* Profit Margin */}
          {report.totalSales > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-xs text-muted-foreground font-medium mb-2">Profit Margin</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-700"
                    style={{ width: `${Math.min(100, (report.totalProfit / report.totalSales) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-success">
                  {((report.totalProfit / report.totalSales) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Sales by Category */}
          {report.salesByCategory.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Sales by Category
              </h3>
              <div className="space-y-3">
                {report.salesByCategory
                  .sort((a, b) => b.amount - a.amount)
                  .map(item => {
                    const maxAmount = Math.max(...report.salesByCategory.map(i => i.amount));
                    const percentage = (item.amount / maxAmount) * 100;
                    return (
                      <div key={item.category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-foreground">
                            {getCategoryLabel(item.category)}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                        <div className="bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full gradient-gold transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Sales by Payment */}
          {report.salesByPayment.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <h3 className="text-sm font-semibold text-foreground mb-3">Payment Methods</h3>
              <div className="grid grid-cols-2 gap-3">
                {report.salesByPayment.map(item => (
                  <div key={item.method} className="bg-secondary rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground capitalize font-medium">{item.method}</p>
                    <p className="text-sm font-bold text-foreground mt-1">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sales */}
          {recentSales.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Sales
              </h3>
              <div className="space-y-2">
                {recentSales.map(sale => (
                  <div key={sale.id} className="bg-card rounded-xl p-3 shadow-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{sale.productName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Qty: {sale.quantity} • {sale.paymentMethod === 'cash' ? '💵 Cash' : '📲 Transfer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(sale.totalAmount)}</p>
                        <p className="text-xs text-success font-medium">+{formatCurrency(sale.profit)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Layout>
  );
};

export default Reports;
