import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { reportsApi, salesApi, formatCurrency } from '@/lib/api';
import type { ReportData, Period } from '@/types';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Clock, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/types';

const Reports = () => {
  const [period, setPeriod] = useState<Period>('daily');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const { toast } = useToast();

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let data;
      if (period === 'daily') {
        data = await reportsApi.getDaily();
      } else if (period === 'weekly') {
        data = await reportsApi.getWeekly();
      } else {
        data = await reportsApi.getMonthly();
      }
      console.log('📊 Report data:', data);
      setReport(data);
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to load report', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!startDate || !endDate) {
      toast({ 
        title: 'Error', 
        description: 'Please select both start and end dates', 
        variant: 'destructive' 
      });
      return;
    }

    setExporting(true);
    try {
      const blob = await reportsApi.exportReport(startDate, endDate);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${startDate}-to-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'Success', description: 'Report downloaded successfully' });
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to export report', 
        variant: 'destructive' 
      });
    } finally {
      setExporting(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat.toLowerCase());
    return found ? `${found.icon} ${found.label}` : cat;
  };

  const getSourceLabel = (source: string) => {
    if (source === 'WALK_IN') return '🚶 Walk-in';
    if (source === 'WEBSITE') return '🌐 Website';
    return source;
  };

  const periods: { value: Period; label: string }[] = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
  ];

  return (
    <Layout
      title="Reports"
      subtitle="Sales performance"
    >
      {/* Period Tabs */}
      <div className="flex gap-2 mb-5">
        {periods.map((p) => (
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

      {/* Export Section with Date Pickers */}
      <div className="bg-card rounded-2xl p-4 shadow-card mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          Export PDF Report
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={exporting || !startDate || !endDate}
            className="w-full h-11 rounded-xl gradient-gold text-accent-foreground font-semibold hover:opacity-90"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Download PDF Report'}
          </Button>
        </div>
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
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Revenue</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(report.revenue)}</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <TrendingUp className="h-5 w-5 text-info mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Profit</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(report.profit)}</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <ShoppingBag className="h-5 w-5 text-gold mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Orders</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{report.transactions}</p>
            </div>
          </div>

          {/* Profit Margin */}
          {report.revenue > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-xs text-muted-foreground font-medium mb-2">Profit Margin</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-700"
                    style={{ width: `${Math.min(100, report.profitMargin)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-success">
                  {report.profitMargin}%
                </span>
              </div>
            </div>
          )}

          {/* Sales by Category */}
          {Object.keys(report.byCategory).length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Sales by Category
              </h3>
              <div className="space-y-3">
                {Object.entries(report.byCategory)
                  .sort(([, a], [, b]) => b.revenue - a.revenue)
                  .map(([category, data]) => {
                    const maxRevenue = Math.max(...Object.values(report.byCategory).map(c => c.revenue));
                    const percentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-foreground">
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {formatCurrency(data.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full gradient-gold transition-all duration-700"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-success">
                            +{formatCurrency(data.profit)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Sales by Source */}
          {Object.keys(report.bySource).length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <h3 className="text-sm font-semibold text-foreground mb-3">Sales by Source</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(report.bySource).map(([source, data]) => (
                  <div key={source} className="bg-secondary rounded-xl p-3">
                    <p className="text-xs text-muted-foreground font-medium">{getSourceLabel(source)}</p>
                    <p className="text-sm font-bold text-foreground mt-1">{formatCurrency(data.revenue)}</p>
                    <p className="text-xs text-success mt-0.5">Profit: {formatCurrency(data.profit)}</p>
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