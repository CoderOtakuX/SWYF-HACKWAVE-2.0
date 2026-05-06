import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Package,
  Plus,
  TrendingUp,
  ShoppingBag,
  Upload,
  X,
  Check,
  Clock,
  IndianRupee,
  Image as ImageIcon,
  Tag,
  Ruler,
  Palette,
  FileText,
  Link as LinkIcon,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const VendorDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'earnings' | 'add'>('listings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<{ id: string; file: File; preview: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'MENS',
    price: '',
    sizes: [] as string[],
    fabric: '',
    description: '',
    importUrl: '',
    colorTags: '',
  });

  // Fetch vendor's products from Supabase
  const fetchMyProducts = async () => {
    if (!user?.id) return;
    setIsLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setVendorProducts(data);
    if (error) console.error('Error fetching products:', error);
    setIsLoadingProducts(false);
  };

  useEffect(() => {
    fetchMyProducts();
  }, [user]);

  // Stats
  const approvedCount = vendorProducts.filter(p => p.status === 'approved').length;
  const pendingCount = vendorProducts.filter(p => p.status === 'pending').length;
  const rejectedCount = vendorProducts.filter(p => p.status === 'rejected').length;

  const toggleSize = (size: string) => {
    setNewProduct(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size],
    }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - uploadedImages.length;
    if (remaining <= 0) {
      toast({ title: 'Limit Reached', description: 'You can upload up to 5 images.', variant: 'destructive' });
      return;
    }
    const newFiles = Array.from(files).slice(0, remaining);
    const newImages = newFiles
      .filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
      .map(file => ({
        id: Math.random().toString(36).slice(2),
        file,
        preview: URL.createObjectURL(file),
      }));
    if (newImages.length < newFiles.length) {
      toast({ title: 'Some files skipped', description: 'Only JPG/PNG under 5MB are accepted.' });
    }
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmitProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      toast({ title: 'Missing Fields', description: 'Please fill in the product name and price.', variant: 'destructive' });
      return;
    }
    if (uploadedImages.length === 0) {
      toast({ title: 'No Images', description: 'Please upload at least one product image.', variant: 'destructive' });
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    toast({ title: 'Uploading...', description: 'Uploading images and submitting product...' });

    try {
      // 1. Upload Images to Supabase Storage
      const imageUrls: string[] = [];
      for (const img of uploadedImages) {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, img.file);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          continue;
        }

        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        imageUrls.push(data.publicUrl);
      }

      // 2. Insert product into DB with "pending" status
      const { error } = await supabase.from('products').insert([{
        vendor_id: user.id,
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        sizes: newProduct.sizes,
        fabric: newProduct.fabric,
        description: newProduct.description,
        image_urls: imageUrls,
        color_tags: newProduct.colorTags,
        status: 'pending'
      }]);

      if (error) throw error;

      toast({
        title: 'Product Submitted ✅',
        description: `"${newProduct.name}" is now pending admin approval.`,
      });

      // Cleanup
      uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setUploadedImages([]);
      setNewProduct({ name: '', category: 'MENS', price: '', sizes: [], fabric: '', description: '', importUrl: '', colorTags: '' });
      setActiveTab('listings');
      
      // Refresh listings
      await fetchMyProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit product.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400';
      case 'rejected': return 'bg-red-500/10 text-red-400';
      default: return 'bg-foreground/5 text-foreground/50';
    }
  };

  return (
    <Layout>
      <div className="pt-28 pb-20">
        <motion.div className="absolute inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-accent/5 to-background" />
        </motion.div>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <motion.div className="flex items-center justify-between mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg text-white font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || '🧵'}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">{user?.name || 'Vendor'}</h1>
                <p className="text-sm text-foreground/50">Vendor Dashboard</p>
              </div>
            </div>
            <motion.button
              onClick={() => { setActiveTab('add'); }}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="h-4 w-4" /> Add Product
            </motion.button>
          </motion.div>

          {/* Stats Cards */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {[
              { icon: Package, label: 'Total Products', value: vendorProducts.length, color: 'from-blue-500 to-cyan-500' },
              { icon: Check, label: 'Approved', value: approvedCount, color: 'from-green-500 to-emerald-500' },
              { icon: Clock, label: 'Pending Review', value: pendingCount, color: 'from-yellow-500 to-amber-500' },
              { icon: AlertTriangle, label: 'Rejected', value: rejectedCount, color: 'from-red-500 to-pink-500' },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <motion.div
                key={label}
                className="glass-card rounded-2xl p-5 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full bg-gradient-to-br ${color} opacity-10`} />
                <Icon className="h-5 w-5 text-foreground/40 mb-2" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-foreground/50 mt-1">{label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: 'listings', label: 'My Listings', icon: Package },
              { key: 'add', label: 'Add Product', icon: Plus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-2 transition-all ${activeTab === key
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-foreground/5 text-foreground/60 hover:bg-primary/10'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* LISTINGS TAB */}
            {activeTab === 'listings' && (
              <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Your Products ({vendorProducts.length})</h3>
                    <button onClick={fetchMyProducts} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> Refresh
                    </button>
                  </div>
                  
                  {isLoadingProducts ? (
                    <div className="p-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40 mb-3" />
                      <p className="text-sm text-foreground/40">Loading your products...</p>
                    </div>
                  ) : vendorProducts.length === 0 ? (
                    <div className="p-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-foreground/20 mb-4" />
                      <p className="text-foreground/50 text-lg font-medium">No products yet</p>
                      <p className="text-foreground/30 text-sm mt-1">Click "Add Product" to upload your first listing.</p>
                      <button
                        onClick={() => setActiveTab('add')}
                        className="mt-4 px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
                      >
                        <Plus className="h-4 w-4 inline mr-1" /> Add Product
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {vendorProducts.map(product => (
                        <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                          {/* Image */}
                          {product.image_urls && product.image_urls.length > 0 ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-foreground/5 flex-shrink-0">
                              <img src={product.image_urls[0]} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-foreground/5 flex-shrink-0 flex items-center justify-center">
                              <Package className="h-6 w-6 text-foreground/20" />
                            </div>
                          )}
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                            <p className="text-xs text-foreground/50">{product.category} · ₹{product.price?.toLocaleString()}</p>
                            {product.fabric && <p className="text-xs text-foreground/30 mt-0.5">{product.fabric}</p>}
                          </div>

                          {/* Status badge */}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge(product.status)}`}>
                            {product.status}
                          </span>
                          
                          {/* Date */}
                          <p className="text-xs text-foreground/30 hidden md:block">
                            {new Date(product.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ADD PRODUCT TAB */}
            {activeTab === 'add' && (
              <motion.div key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" /> Add New Product
                  </h2>

                  <div className="space-y-5">
                    {/* Product Name */}
                    <div>
                      <label className="text-xs text-foreground/50 mb-1.5 block flex items-center gap-1"><Tag className="h-3 w-3" /> Product Name *</label>
                      <input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="e.g. Royal Silk Kurta" className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                    </div>

                    {/* Category + Price */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-foreground/50 mb-1.5 block">Category</label>
                        <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:outline-none">
                          <option value="MENS">Men's</option>
                          <option value="WOMENS">Women's</option>
                          <option value="UNISEX">Unisex</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-foreground/50 mb-1.5 block flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Price (₹) *</label>
                        <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="1499" className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <label className="text-xs text-foreground/50 mb-1.5 block flex items-center gap-1"><Ruler className="h-3 w-3" /> Sizes Available</label>
                      <div className="flex flex-wrap gap-2">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${newProduct.sizes.includes(size) ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/60 hover:bg-primary/10'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fabric + Color */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-foreground/50 mb-1.5 block">Fabric</label>
                        <input value={newProduct.fabric} onChange={e => setNewProduct({ ...newProduct, fabric: e.target.value })} placeholder="e.g. Pure Silk" className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-foreground/50 mb-1.5 block flex items-center gap-1"><Palette className="h-3 w-3" /> Color Tags</label>
                        <input value={newProduct.colorTags} onChange={e => setNewProduct({ ...newProduct, colorTags: e.target.value })} placeholder="Blue, Navy, Indigo" className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs text-foreground/50 mb-1.5 block flex items-center gap-1"><FileText className="h-3 w-3" /> Description</label>
                      <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} rows={3} placeholder="Describe the product..." className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none resize-none" />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="text-xs text-foreground/50 mb-1.5 block flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Product Images * ({uploadedImages.length}/5)</label>
                      
                      {/* Preview Grid */}
                      {uploadedImages.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-3">
                          {uploadedImages.map(img => (
                            <motion.div
                              key={img.id}
                              className="relative w-20 h-20 rounded-xl overflow-hidden group"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              layout
                            >
                              <img src={img.preview} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Drop Zone */}
                      {uploadedImages.length < 5 && (
                        <div
                          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                            isDragging
                              ? 'border-primary/60 bg-primary/5'
                              : 'border-white/10 hover:border-primary/30'
                          }`}
                        >
                          <Upload className={`h-7 w-7 mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-foreground/30'}`} />
                          <p className="text-sm text-foreground/50">
                            {isDragging ? 'Drop images here' : 'Click or drag images here'}
                          </p>
                          <p className="text-xs text-foreground/30 mt-1">JPG, PNG — Max 5MB each</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        multiple
                        className="hidden"
                        onChange={e => handleFiles(e.target.files)}
                      />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setActiveTab('listings')} className="px-6 py-3 rounded-xl text-sm font-medium bg-foreground/5 text-foreground/60 hover:bg-foreground/10 transition-all">
                        Cancel
                      </button>
                      <motion.button
                        onClick={handleSubmitProduct}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      >
                        {isSubmitting ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                        ) : (
                          <><Check className="h-4 w-4" /> Submit for Admin Review</>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </Layout>
  );
};

export default VendorDashboard;
