import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { ordersApi, formatCurrency } from '@/lib/api';
import type { Order, OrderStatus } from '@/types';
import { 
  Search, X, Package, Phone, Clock, CheckCircle2, Ban, 
  CreditCard, ChevronRight, AlertCircle, Download, Receipt,
  Calendar, CalendarRange, Filter, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { LucideIcon } from 'lucide-react';

// Updated statusConfig - removed 'paid' as it's no longer in backend
const statusConfig: Record<string, { label: string; className: string; icon: LucideIcon }> = {
  pending: { label: 'Pending', className: 'bg-warning-light text-warning-foreground', icon: Clock },
  completed: { label: 'Completed', className: 'bg-success-light text-success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive', icon: Ban },
};

// Updated statusFilters - removed 'paid'
const statusFilters: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Store all orders for client-side filtering
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  // Date filter states
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [specificDate, setSpecificDate] = useState('');
  const [todayFilter, setTodayFilter] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAllOrders();
  }, []);

  const loadAllOrders = async () => {
    setLoading(true);
    try {
      // Only fetch with date filters, not status
      const params: any = {};
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (specificDate) params.date = specificDate;
      if (todayFilter) params.today = true;
      
      const data = await ordersApi.getAll(params);
      setAllOrders(data);
      setOrders(data); // Initially show all orders
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering based on status and search
  useEffect(() => {
    let filtered = [...allOrders];
    
    // Apply status filter (client-side)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter (client-side)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower)
      );
    }
    
    setOrders(filtered);
  }, [statusFilter, search, allOrders]);

  const handleApplyFilters = () => {
    loadAllOrders(); // Reload with new date filters
    setShowDateFilters(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setSpecificDate('');
    setTodayFilter(false);
    loadAllOrders(); // Reload with no date filters
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const updated = await ordersApi.updateStatus(orderId, newStatus);
      
      // Update both states
      setAllOrders(prev => prev.map(o => o.id === orderId ? updated : o));
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
      
      // Update both states
      setAllOrders(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
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

  const pendingCount = allOrders.filter(o => o.status === 'pending').length;

  // Helper function to normalize status
  const getNormalizedStatus = (status: string): string => {
    return status?.toLowerCase() || 'pending';
  };

  return (
    <Layout
      title="Orders"
      subtitle={`${allOrders.length} orders${pendingCount > 0 ? ` • ${pendingCount} pending` : ''}`}
      headerRight={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDateFilters(!showDateFilters)}
          className={`text-muted-foreground hover:text-primary ${showDateFilters ? 'text-primary' : ''}`}
        >
          <Filter className="h-5 w-5" />
        </Button>
      }
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

        {/* Status Filter - Client-side filtering */}
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

        {/* Date Filters */}
        {showDateFilters && (
          <div className="bg-card rounded-xl p-4 shadow-card animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Date Filters
            </h3>
            
            <div className="space-y-3">
              {/* Today Filter */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="todayFilter"
                  checked={todayFilter}
                  onChange={(e) => {
                    setTodayFilter(e.target.checked);
                    if (e.target.checked) {
                      setSpecificDate('');
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="todayFilter" className="text-sm cursor-pointer">
                  Today only
                </Label>
              </div>

              {/* Specific Date */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Specific Date</Label>
                <Input
                  type="date"
                  value={specificDate}
                  onChange={(e) => {
                    setSpecificDate(e.target.value);
                    if (e.target.value) {
                      setTodayFilter(false);
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  className="rounded-xl h-9 text-sm"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value || endDate) {
                        setTodayFilter(false);
                        setSpecificDate('');
                      }
                    }}
                    className="rounded-xl h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (startDate || e.target.value) {
                        setTodayFilter(false);
                        setSpecificDate('');
                      }
                    }}
                    className="rounded-xl h-9 text-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleApplyFilters}
                  size="sm"
                  className="flex-1 rounded-xl gradient-gold text-accent-foreground"
                >
                  Apply Filters
                </Button>
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAllOrders}
            className="text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order, index) => {
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {order.customerName} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
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

      {/* Order Detail Dialog - Keep the same */}
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
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                        disabled={updating}
                        className="w-full h-12 rounded-xl bg-success text-success-foreground font-semibold hover:opacity-90"
                      >
                        {updating ? 'Updating...' : '📦 Mark as Completed'}
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

                  {normalizedStatus === 'completed' && (
                    <div className="space-y-2">
                      <div className="bg-success-light rounded-xl p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                        <p className="text-sm font-medium text-success-foreground">Order Completed</p>
                      </div>
                      
                      {/* Receipt Download Button for completed orders */}
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