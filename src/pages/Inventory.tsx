import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { productsApi, formatCurrency, getDiscountedPrice } from '@/lib/api';
import { DEFAULT_CATEGORIES, type Product, type ProductFormData, type ProductCategory, type ProductMedia, type ProductDiscount } from '@/types';
import { Plus, Search, Edit2, Trash2, X, Package, Image, Film, Eye, EyeOff, Percent, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import ProductFormDialog from '@/components/inventory/ProductFormDialog';

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());

    // Convert both to lowercase for comparison
    const productCategory = p.category?.toLowerCase();
    const filterCategory = categoryFilter.toLowerCase();

    const matchesCategory = categoryFilter === 'all' || productCategory === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const openAddDialog = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (form: ProductFormData & { newFiles?: any[] }) => {
    setSubmitting(true);
    try {
      if (editingProduct) {
        console.log('🔄 Updating product:', editingProduct.id);
        console.log('📝 With data:', form);

        await productsApi.update(editingProduct.id, form, editingProduct);
        toast({ title: 'Updated!', description: `${form.name} has been updated` });
      } else {
        console.log('🆕 Creating new product');
        await productsApi.create(form);
        toast({ title: 'Added!', description: `${form.name} has been added to inventory` });
      }
      setDialogOpen(false);
      loadProducts();
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save product',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await productsApi.delete(deletingProduct.id);
      toast({ title: 'Deleted', description: `${deletingProduct.name} has been removed` });
      setDeleteDialogOpen(false);
      loadProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getCategoryEmoji = (category: string) => {
    return DEFAULT_CATEGORIES.find(c => c.value === category)?.icon || '📦';
  };

  return (
    <Layout
      title="Inventory"
      subtitle={`${products.length} products`}
      headerRight={
        <Button onClick={openAddDialog} size="sm" className="gradient-gold text-accent-foreground rounded-xl font-semibold hover:opacity-90">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      }
    >
      {/* Search & Filter */}
      <div className="space-y-3 mb-4">
        <div className="relative">
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

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${categoryFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
              }`}
          >
            All
          </button>
          {DEFAULT_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${categoryFilter === cat.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
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
          <p className="text-muted-foreground font-medium">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product, index) => {
            const discountedPrice = getDiscountedPrice(product);
            return (
              <div
                key={product.id}
                className="bg-card rounded-xl p-3 shadow-card animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-secondary">
                    {getCategoryEmoji(product.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                      {product.visibleOnWebsite && (
                        <Eye className="h-3 w-3 text-info shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className={`text-xs font-semibold ${product.quantity <= 5 ? 'text-warning' : 'text-success'}`}>
                        {product.quantity} in stock
                      </span>
                      {product.media.length > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {product.media.length} media
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(product.sellingPrice)}</p>
                    {discountedPrice !== null && (
                      <p className="text-xs font-semibold text-success">
                        Web: {formatCurrency(discountedPrice)}
                      </p>
                    )}
                    {discountedPrice === null && (
                      <p className="text-xs text-muted-foreground">Cost: {formatCurrency(product.costPrice)}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => openEditDialog(product)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => openDeleteDialog(product)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingProduct={editingProduct}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Inventory;
