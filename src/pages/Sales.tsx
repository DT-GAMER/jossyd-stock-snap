import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { productsApi, salesApi, formatCurrency } from '@/lib/api';
import type { Product, PaymentMethod } from '@/types';
import { ShoppingCart, Check, Banknote, ArrowRightLeft, Minus, Plus, Search, X, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';

const Sales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data.filter(p => p.quantity > 0));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setUnitPrice(product.sellingPrice);
    setQuantity(1);
  };

  const handleSubmitSale = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await salesApi.create({
        productId: selectedProduct.id,
        quantity,
        paymentMethod,
        unitPrice,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedProduct(null);
        setQuantity(1);
        setUnitPrice(0);
        setPaymentMethod('cash');
        loadProducts();
      }, 2000);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <Layout title="Sales">
        <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center mb-4">
            <Check className="h-10 w-10 text-success-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Sale Recorded!</h2>
          <p className="text-muted-foreground mt-1">Inventory updated automatically</p>
        </div>
      </Layout>
    );
  }

  // Product Selection
  if (!selectedProduct) {
    return (
      <Layout 
        title="New Sale" 
        subtitle="Select a product" 
        headerRight={
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/sales/history')}
            className="text-muted-foreground cursor-pointer"
          >
            <p>Sales History</p>
            <History className="h-5 w-5" />
          </Button>
      }>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
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

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No products available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((product, index) => (
              <button
                key={product.id}
                onClick={() => selectProduct(product)}
                className="w-full bg-card rounded-xl p-4 shadow-card text-left hover:shadow-card-hover transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {product.category} • {product.quantity} in stock
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(product.sellingPrice)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  // Sale Form
  const total = unitPrice * quantity;
  const profit = (unitPrice - selectedProduct.costPrice) * quantity;

  return (
    <Layout title="New Sale" subtitle={selectedProduct.name}>
      <div className="space-y-6 animate-slide-up">
        {/* Selected Product Card */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground">{selectedProduct.name}</h3>
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Change
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Base price: {formatCurrency(selectedProduct.sellingPrice)} • {selectedProduct.quantity} available
          </p>
        </div>

        {/* Editable Selling Price */}
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-1.5">
            <Edit3 className="h-3.5 w-3.5" />
            Selling Price (₦)
          </Label>
          <Input
            type="number"
            value={unitPrice || ''}
            onChange={e => setUnitPrice(Number(e.target.value))}
            min={0}
            className="h-12 rounded-xl text-lg font-semibold"
          />
          {unitPrice !== selectedProduct.sellingPrice && (
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-muted-foreground">
                Base: {formatCurrency(selectedProduct.sellingPrice)}
              </p>
              <button
                onClick={() => setUnitPrice(selectedProduct.sellingPrice)}
                className="text-xs text-info font-medium hover:underline"
              >
                Reset to base
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Cost price: {formatCurrency(selectedProduct.costPrice)} (fixed)
          </p>
        </div>

        {/* Quantity Selector */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-3 block">Quantity</label>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <Minus className="h-5 w-5 text-foreground" />
            </button>
            <span className="text-3xl font-bold text-foreground min-w-[60px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(selectedProduct.quantity, quantity + 1))}
              className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <Plus className="h-5 w-5 text-foreground" />
            </button>
          </div>
          {quantity >= selectedProduct.quantity && (
            <p className="text-xs text-warning text-center mt-2">Maximum stock reached</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-3 block">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'cash'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
                }`}
            >
              <Banknote className={`h-6 w-6 ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-semibold ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`}>
                Cash
              </span>
            </button>
            <button
              onClick={() => setPaymentMethod('transfer')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'transfer'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
                }`}
            >
              <ArrowRightLeft className={`h-6 w-6 ${paymentMethod === 'transfer' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-semibold ${paymentMethod === 'transfer' ? 'text-primary' : 'text-muted-foreground'}`}>
                Transfer
              </span>
            </button>
          </div>
        </div>

        {/* Total & Submit */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground">Estimated Profit</span>
            <span className={`text-sm font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(profit)}
            </span>
          </div>
          <Button
            onClick={handleSubmitSale}
            disabled={submitting || unitPrice <= 0}
            className="w-full h-14 rounded-xl gradient-gold text-accent-foreground font-bold text-base hover:opacity-90"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Record Sale
              </div>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Sales;
