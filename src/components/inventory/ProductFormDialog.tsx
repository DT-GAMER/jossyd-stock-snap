import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/api';
import { productsApi } from '@/lib/api';
import { DEFAULT_CATEGORIES, type Product, type ProductFormData, type ProductCategory, type ProductMedia, type ProductDiscount } from '@/types';
import { Image, Film, X, Percent, Tag, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

// Extended type to include File objects and preview URLs
interface MediaFile extends ProductMedia {
  file?: File;
  previewUrl?: string;
  isExisting?: boolean;
}

interface ProductFormDataWithFiles extends Omit<ProductFormData, 'media'> {
  media: MediaFile[];
  newFiles?: { file: File; type: string }[];
}

const emptyForm: ProductFormDataWithFiles = {
  name: '',
  description: '',
  category: '',
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
  onSubmit: (form: ProductFormData & { newFiles?: { file: File; type: string }[] }) => void;
}

const ProductFormDialog = ({ open, onOpenChange, editingProduct, submitting, onSubmit }: ProductFormDialogProps) => {
  const [form, setForm] = useState<ProductFormDataWithFiles>(emptyForm);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);
  const { toast } = useToast();

  // Load categories when dialog opens
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await productsApi.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Initialize form when dialog opens or editingProduct changes
  useEffect(() => {
    if (open && editingProduct) {

      const mediaWithPreviews = (editingProduct.media || []).map(m => ({
        ...m,
        previewUrl: m.url,
        isExisting: true,
      }));

      setForm({
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        category: editingProduct.category || '',
        costPrice: editingProduct.costPrice || 0,
        sellingPrice: editingProduct.sellingPrice || 0,
        quantity: editingProduct.quantity || 0,
        media: mediaWithPreviews,
        visibleOnWebsite: editingProduct.visibleOnWebsite || false,
        discount: editingProduct.discount,
      });

      setHasDiscount(!!editingProduct.discount);
      setImageErrors({});
    } else if (open && !editingProduct) {
      setForm(emptyForm);
      setHasDiscount(false);
      setImageErrors({});
    }
  }, [open, editingProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.category) {
      toast({
        title: 'Error',
        description: 'Please select a category',
        variant: 'destructive'
      });
      return;
    }

    // Prepare existing media (keep them)
    const existingMedia = form.media
      .filter(m => m.isExisting)
      .map(m => ({
        id: m.id!,
        url: m.url!,
        type: m.type
      }));

    // Prepare new files
    const newFiles = form.media
      .filter(m => !m.isExisting && m.file)
      .map(m => ({
        file: m.file!,
        type: m.type
      }));

    const submitData: ProductFormData = {
      name: form.name,
      description: form.description,
      category: form.category,
      costPrice: form.costPrice,
      sellingPrice: form.sellingPrice,
      quantity: form.quantity,
      media: existingMedia,
      visibleOnWebsite: form.visibleOnWebsite,
    };

    if (hasDiscount && form.discount) {
      submitData.discount = form.discount;
    }

    onSubmit({
      ...submitData,
      newFiles
    });
  };

  const addMediaSlot = (type: 'image' | 'video') => {
    if (form.media.length >= 3) {
      toast({
        title: 'Limit Reached',
        description: 'Maximum 3 media files allowed',
        variant: 'destructive'
      });
      return;
    }
    const newMedia: MediaFile = {
      id: `temp-${Date.now()}`,
      url: '',
      type,
    };
    setForm({ ...form, media: [...form.media, newMedia] });
  };

  const handleFileSelect = (index: number, file: File) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive'
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const updated = [...form.media];
    updated[index] = {
      ...updated[index],
      file,
      previewUrl,
      url: previewUrl,
      isExisting: false,
    };
    setForm({ ...form, media: updated });

    // Clear any error for this media
    if (imageErrors[updated[index].id]) {
      setImageErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[updated[index].id];
        return newErrors;
      });
    }
  };

  const handleDeleteExistingImage = async (mediaId: string, index: number) => {
    if (!editingProduct) return;

    setDeletingMedia(mediaId);
    try {
      // Call API to delete the media immediately
      await productsApi.deleteMedia(mediaId);

      // Remove from local state
      const updatedMedia = form.media.filter((_, i) => i !== index);
      setForm({ ...form, media: updatedMedia });

      toast({
        title: 'Success',
        description: 'Image deleted successfully. You can now add a new one.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete image',
        variant: 'destructive'
      });
    } finally {
      setDeletingMedia(null);
    }
  };

  const removeNewMedia = (index: number) => {
    const media = form.media[index];

    // Clean up object URL if it's a blob
    if (media.previewUrl && media.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(media.previewUrl);
    }

    // Remove from state
    setForm({
      ...form,
      media: form.media.filter((_, i) => i !== index)
    });
  };

  const handleImageError = (mediaId: string) => {
    setImageErrors(prev => ({ ...prev, [mediaId]: true }));
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

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Size 32 plain cotton trouser pants"
              required
              className="rounded-xl"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={v => setForm({ ...form, category: v })}
              disabled={loadingCategories}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select a category"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
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
              Media ({form.media.length}/3)
            </Label>

            <div className="space-y-4">
              {form.media.map((m, i) => {
                return (
                  <div key={m.id} className="border border-border rounded-xl p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      {m.type === 'image' ? (
                        <Image className="h-4 w-4 text-info shrink-0" />
                      ) : (
                        <Film className="h-4 w-4 text-info shrink-0" />
                      )}

                      {/* File input for new images, filename display for existing */}
                      {!m.isExisting ? (
                        <input
                          type="file"
                          accept={m.type === 'image' ? 'image/*' : 'video/*'}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(i, file);
                            }
                          }}
                          className="h-8 text-xs flex-1 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground flex-1 truncate">
                          {m.url?.split('/').pop() || 'Image uploaded'}
                        </span>
                      )}

                      {/* Delete button */}
                      {m.isExisting ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(m.id, i)}
                          disabled={deletingMedia === m.id}
                          className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                          title="Delete permanently"
                        >
                          {deletingMedia === m.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeNewMedia(i)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                          title="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {m.type === 'image' && m.previewUrl && !imageErrors[m.id] && (
                      <div className="relative w-full rounded-lg overflow-hidden border border-border bg-muted">
                        <img
                          src={m.previewUrl}
                          alt="Preview"
                          className="w-full h-auto object-contain max-h-48"
                          onError={() => handleImageError(m.id)}
                        />
                        {m.isExisting && (
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            Existing
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add Media Buttons */}
              {form.media.length < 2 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs flex-1"
                    onClick={() => addMediaSlot('image')}
                  >
                    <Image className="h-3 w-3 mr-1" />
                    Add Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs flex-1"
                    onClick={() => addMediaSlot('video')}
                  >
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
            disabled={submitting || !form.category}
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