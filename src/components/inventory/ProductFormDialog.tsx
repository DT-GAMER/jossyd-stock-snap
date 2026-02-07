import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/api';
import { CATEGORIES, type Product, type ProductFormData, type ProductCategory, type ProductMedia, type ProductDiscount } from '@/types';
import { Image, Film, X, Percent, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

const emptyForm: ProductFormData = {
  name: '',
  category: 'clothes',
  costPrice: 0,
  sellingPrice: 0,
  quantity: 0,
  media: [],
  visibleOnWebsite: false,
};

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  submitting: boolean;
  onSubmit: (form: ProductFormData) => void;
}

const ProductFormDialog = ({ open, onOpenChange, editingProduct, submitting, onSubmit }: ProductFormDialogProps) => {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [hasDiscount, setHasDiscount] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setForm({
          name: editingProduct.name,
          category: editingProduct.category,
          costPrice: editingProduct.costPrice,
          sellingPrice: editingProduct.sellingPrice,
          quantity: editingProduct.quantity,
          media: editingProduct.media || [],
          visibleOnWebsite: editingProduct.visibleOnWebsite || false,
          discount: editingProduct.discount,
        });
        setHasDiscount(!!editingProduct.discount);
      } else {
        setForm(emptyForm);
        setHasDiscount(false);
      }
    }
  }, [open, editingProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...form };
    if (!hasDiscount) {
      delete submitData.discount;
    }
    onSubmit(submitData);
  };

  const addMediaSlot = (type: 'image' | 'video') => {
    if (form.media.length >= 2) return;
    const newMedia: ProductMedia = {
      id: `media-${Date.now()}`,
      url: '',
      type,
    };
    setForm({ ...form, media: [...form.media, newMedia] });
  };

  const updateMediaUrl = (index: number, url: string) => {
    const updated = [...form.media];
    updated[index] = { ...updated[index], url };
    setForm({ ...form, media: updated });
  };

  const removeMedia = (index: number) => {
    setForm({ ...form, media: form.media.filter((_, i) => i !== index) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ankara Dress"
              required
              className="rounded-xl"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as ProductCategory })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cost Price (₦)</Label>
              <Input
                type="number"
                value={form.costPrice || ''}
                onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })}
                placeholder="0"
                required
                min={0}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Selling Price (₦)</Label>
              <Input
                type="number"
                value={form.sellingPrice || ''}
                onChange={e => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                placeholder="0"
                required
                min={0}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              value={form.quantity || ''}
              onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
              placeholder="0"
              required
              min={0}
              className="rounded-xl"
            />
          </div>

          {/* Profit Preview */}
          {form.sellingPrice > 0 && form.costPrice > 0 && (
            <div className="bg-success-light rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Profit per unit</p>
              <p className="text-lg font-bold text-success">
                {formatCurrency(form.sellingPrice - form.costPrice)}
              </p>
            </div>
          )}

          {/* Media Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              Media (max 2)
            </Label>
            <div className="space-y-2">
              {form.media.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2 bg-secondary rounded-xl p-2">
                  {m.type === 'image' ? (
                    <Image className="h-4 w-4 text-info shrink-0" />
                  ) : (
                    <Film className="h-4 w-4 text-info shrink-0" />
                  )}
                  <Input
                    value={m.url}
                    onChange={e => updateMediaUrl(i, e.target.value)}
                    placeholder={`${m.type === 'image' ? 'Image' : 'Video'} URL`}
                    className="h-8 text-xs rounded-lg flex-1"
                  />
                  <button type="button" onClick={() => removeMedia(i)} className="p-1 text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {form.media.length < 2 && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs flex-1" onClick={() => addMediaSlot('image')}>
                    <Image className="h-3 w-3 mr-1" />
                    Add Image
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="rounded-lg text-xs flex-1" onClick={() => addMediaSlot('video')}>
                    <Film className="h-3 w-3 mr-1" />
                    Add Video
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Website Visibility */}
          <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
            <Label className="flex items-center gap-2 cursor-pointer">
              {form.visibleOnWebsite ? (
                <Tag className="h-4 w-4 text-info" />
              ) : (
                <Tag className="h-4 w-4 text-muted-foreground" />
              )}
              Visible on Website
            </Label>
            <Switch
              checked={form.visibleOnWebsite}
              onCheckedChange={v => setForm({ ...form, visibleOnWebsite: v })}
            />
          </div>

          {/* Discount Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Percent className="h-4 w-4 text-muted-foreground" />
                Add Discount (Website)
              </Label>
              <Switch
                checked={hasDiscount}
                onCheckedChange={v => {
                  setHasDiscount(v);
                  if (v && !form.discount) {
                    setForm({ ...form, discount: { type: 'percentage', value: 0 } });
                  }
                }}
              />
            </div>
            {hasDiscount && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div className="space-y-2">
                  <Label className="text-xs">Discount Type</Label>
                  <Select
                    value={form.discount?.type || 'percentage'}
                    onValueChange={v => setForm({ ...form, discount: { type: v as 'percentage' | 'fixed', value: form.discount?.value || 0 } })}
                  >
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (₦)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Value</Label>
                  <Input
                    type="number"
                    value={form.discount?.value || ''}
                    onChange={e => setForm({ ...form, discount: { type: form.discount?.type || 'percentage', value: Number(e.target.value) } })}
                    placeholder="0"
                    min={0}
                    max={form.discount?.type === 'percentage' ? 100 : form.sellingPrice}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                {form.discount && form.discount.value > 0 && form.sellingPrice > 0 && (
                  <div className="col-span-2 bg-info-light rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Website price</p>
                    <p className="text-sm font-bold text-info">
                      {formatCurrency(
                        form.discount.type === 'percentage'
                          ? Math.round(form.sellingPrice * (1 - form.discount.value / 100))
                          : form.sellingPrice - form.discount.value
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl gradient-gold text-accent-foreground font-semibold hover:opacity-90"
          >
            {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
