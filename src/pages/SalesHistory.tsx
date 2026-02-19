import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { salesApi, formatCurrency } from '@/lib/api';
import type { Sale } from '@/types';
import { 
  Search, X, Package, Banknote, ArrowRightLeft, 
  Clock, ChevronRight, ShoppingBag, Globe, Store 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const data = await salesApi.getAll();
      setSales(data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Safe filter with null checks
  const filtered = sales.filter(sale => {
    if (!sale) return false;
    
    const searchLower = search.toLowerCase();
    
    // Search by product names in items
    const productNames = sale.items?.map(item => 
      item.product?.name?.toLowerCase() || ''
    ).join(' ') || '';
    
    const receiptNumber = sale.receiptNumber?.toLowerCase() || '';
    const orderNumber = sale.orderNumber?.toLowerCase() || '';
    const saleId = sale.id?.toLowerCase() || '';
    
    return productNames.includes(searchLower) || 
           receiptNumber.includes(searchLower) || 
           orderNumber.includes(searchLower) ||
           saleId.includes(searchLower);
  });

  const getPaymentIcon = (method: string) => {
    return method === 'CASH' ? 
      <Banknote className="h-4 w-4" /> : 
      <ArrowRightLeft className="h-4 w-4" />;
  };

  const getSourceIcon = (source: string) => {
    return source === 'WEBSITE' ? 
      <Globe className="h-3 w-3" /> : 
      <Store className="h-3 w-3" />;
  };

  // Safe calculations with fallbacks
  const totalSales = sales.reduce((sum, sale) => sum + (sale?.totalAmount || 0), 0);
  const totalProfit = sales.reduce((sum, sale) => sum + (sale?.profit || 0), 0);

  // Get primary product name from first item
  const getProductName = (sale: Sale) => {
    if (sale.items && sale.items.length > 0) {
      const firstItem = sale.items[0];
      if (firstItem.product?.name) {
        const name = firstItem.product.name;
        // If there are multiple items, indicate it
        return sale.items.length > 1 ? `${name} +${sale.items.length - 1}` : name;
      }
    }
    return 'Unknown Product';
  };

  // Get total quantity from all items
  const getTotalQuantity = (sale: Sale) => {
    return sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  };

  return (
    <Layout
      title="Sales History"
      subtitle={`${sales.length} total sales`}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card rounded-xl p-3 shadow-card">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalSales)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 shadow-card">
          <p className="text-xs text-muted-foreground">Total Profit</p>
          <p className="text-lg font-bold text-success">{formatCurrency(totalProfit)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by product, receipt #, or order #..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No sales found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sale, index) => (
            <button
              key={sale.id}
              onClick={() => setSelectedSale(sale)}
              className="w-full bg-card rounded-xl p-3 shadow-card text-left hover:shadow-card-hover transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  sale.paymentMethod === 'cash' ? 'bg-success-light text-success' : 'bg-info-light text-info'
                }`}>
                  {getPaymentIcon(sale.paymentMethod)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {getProductName(sale)}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {getTotalQuantity(sale)} pcs
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                      {getSourceIcon(sale.source)}
                      {sale.source === 'WEBSITE' ? 'Web' : 'Walk-in'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sale.receiptNumber} • {new Date(sale.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex items-center gap-1">
                  <div>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(sale.totalAmount)}</p>
                    <p className="text-xs text-success font-medium">+{formatCurrency(sale.profit)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sale Detail Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[80vh] overflow-y-auto">
          {selectedSale && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Sale Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Receipt Info */}
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-sm font-semibold text-foreground">{selectedSale.receiptNumber}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getSourceIcon(selectedSale.source)}
                    <p className="text-xs text-muted-foreground">
                      {selectedSale.source === 'WEBSITE' ? 'Website Order' : 'Walk-in Sale'}
                    </p>
                  </div>
                  {selectedSale.orderNumber && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Order: {selectedSale.orderNumber}
                    </p>
                  )}
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedSale.items.map((item) => (
                      <div key={item.id} className="bg-card border border-border rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                            {item.quantity} × {formatCurrency(item.sellingPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Cost: {formatCurrency(item.costPrice)}</span>
                          <span className="text-success">Profit: {formatCurrency((item.sellingPrice - item.costPrice) * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-card border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getPaymentIcon(selectedSale.paymentMethod)}
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {selectedSale.paymentMethod.toLowerCase()}
                    </p>
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(selectedSale.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border pt-2">
                    <span className="text-muted-foreground">Total Profit</span>
                    <span className="font-bold text-success">{formatCurrency(selectedSale.profit)}</span>
                  </div>
                </div>

                {/* Date */}
                <p className="text-xs text-muted-foreground text-center">
                  {new Date(selectedSale.createdAt).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SalesHistory;