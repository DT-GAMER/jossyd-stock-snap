import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { ordersApi, formatCurrency } from '@/lib/api';
import type { Order, OrderStatus } from '@/types';
import { 
  Search, X, Package, Phone, Clock, CheckCircle2, Ban, 
  CreditCard, ChevronRight, AlertCircle, Download, Receipt 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { LucideIcon } from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string; icon: LucideIcon }> = {
  pending: { label: 'Pending', className: 'bg-warning-light text-warning-foreground', icon: Clock },
  paid: { label: 'Paid', className: 'bg-info-light text-info', icon: CreditCard },
  completed: { label: 'Completed', className: 'bg-success-light text-success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive', icon: Ban },
};

const statusFilters: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getAll();
      console.log('📦 Loaded orders:', data);
      setOrders(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const updated = await ordersApi.updateStatus(orderId, newStatus);
      console.log('📦 Updated order:', updated);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setSelectedOrder(updated);
      toast({
        title: 'Updated!',
        description: `Order marked as ${newStatus}`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const updated = await ordersApi.updateStatus(selectedOrder.id, 'cancelled');
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
      setSelectedOrder(updated);
      setCancelDialogOpen(false);
      toast({
        title: 'Order Cancelled',
        description: `Order ${selectedOrder.orderNumber} has been cancelled`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadReceipt = async (orderNumber: string) => {
    setDownloading(orderNumber);
    try {
      const blob = await ordersApi.downloadReceipt(orderNumber);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ 
        title: 'Success', 
        description: 'Receipt downloaded successfully' 
      });
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to download receipt', 
        variant: 'destructive' 
      });
    } finally {
      setDownloading(null);
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  // Helper function to normalize status
  const getNormalizedStatus = (status: string): string => {
    return status?.toLowerCase() || 'pending';
  };

  return (
    <Layout
      title="Orders"
      subtitle={`${orders.length} orders${pendingCount > 0 ? ` • ${pendingCount} pending` : ''}`}
    >
      {/* Search */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order # or customer..."
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

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl p-4 shadow-card animate-pulse">
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
          <p className="text-muted-foreground font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order, index) => {
            const normalizedStatus = getNormalizedStatus(order.status);
            const config = statusConfig[normalizedStatus] || statusConfig.pending;
            const StatusIcon = config.icon;
            
            return (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="w-full bg-card rounded-xl p-3 shadow-card text-left hover:shadow-card-hover transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.className}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{order.orderNumber}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${config.className}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.customerName} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(order.totalAmount)}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (() => {
            const normalizedStatus = getNormalizedStatus(selectedOrder.status);
            const config = statusConfig[normalizedStatus] || statusConfig.pending;
            const StatusIcon = config.icon;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedOrder.orderNumber}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${config.className}`}>
                      {config.label}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Customer */}
                  <div className="bg-secondary rounded-xl p-3">
                    <p className="text-sm font-semibold text-foreground">{selectedOrder.customerName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{selectedOrder.customerPhone}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                    <div className="space-y-2">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-card border border-border rounded-lg p-2.5">
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">No items</p>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>

                  {/* Actions based on normalized status */}
                  {normalizedStatus === 'pending' && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'paid')}
                        disabled={updating}
                        className="w-full h-12 rounded-xl gradient-gold text-accent-foreground font-semibold hover:opacity-90"
                      >
                        {updating ? 'Updating...' : '✅ Mark as Paid'}
                      </Button>
                      <Button
                        onClick={() => setCancelDialogOpen(true)}
                        disabled={updating}
                        variant="outline"
                        className="w-full h-12 rounded-xl border-destructive text-destructive hover:bg-destructive/10 font-semibold"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Cancel Order
                      </Button>
                    </div>
                  )}

                  {normalizedStatus === 'paid' && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                        disabled={updating}
                        className="w-full h-12 rounded-xl bg-success text-success-foreground font-semibold hover:opacity-90"
                      >
                        {updating ? 'Updating...' : '📦 Mark as Completed'}
                      </Button>
                      
                      {/* Receipt Download Button */}
                      <Button
                        onClick={() => handleDownloadReceipt(selectedOrder.orderNumber)}
                        disabled={downloading === selectedOrder.orderNumber}
                        variant="outline"
                        className="w-full h-12 rounded-xl border-info text-info hover:bg-info/10 font-semibold"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading === selectedOrder.orderNumber ? 'Downloading...' : 'Download Receipt'}
                      </Button>
                    </div>
                  )}

                  {normalizedStatus === 'completed' && (
                    <div className="space-y-2">
                      <div className="bg-success-light rounded-xl p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                        <p className="text-sm font-medium text-success-foreground">Order Completed</p>
                      </div>
                      
                      {/* Receipt Download Button for completed orders too */}
                      <Button
                        onClick={() => handleDownloadReceipt(selectedOrder.orderNumber)}
                        disabled={downloading === selectedOrder.orderNumber}
                        variant="outline"
                        className="w-full h-12 rounded-xl border-info text-info hover:bg-info/10 font-semibold"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading === selectedOrder.orderNumber ? 'Downloading...' : 'Download Receipt'}
                      </Button>
                    </div>
                  )}

                  {normalizedStatus === 'cancelled' && (
                    <div className="bg-destructive/10 rounded-xl p-4 text-center">
                      <Ban className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-sm font-medium text-destructive">Order Cancelled</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order <span className="font-bold text-foreground">{selectedOrder?.orderNumber}</span>?
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={updating}>
              No, Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={updating}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updating ? 'Cancelling...' : 'Yes, Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Orders;