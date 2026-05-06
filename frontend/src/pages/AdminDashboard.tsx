import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  Package,
  Users,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Check,
  X,
  Clock,
  Eye,
  BarChart3,
  Store,
  CheckCircle,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

const AdminDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'all-products' | 'overview'>('approvals');
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch pending products from Supabase
  const fetchPendingProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, profiles(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setPendingProducts(data);
  };

  // Fetch all products
  const fetchAllProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false });
    if (data) setAllProducts(data);
  };

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchPendingProducts(), fetchAllProducts()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Stats from live data
  const approvedCount = allProducts.filter(p => p.status === 'approved').length;
  const pendingCount = pendingProducts.length;
  const totalProducts = allProducts.length;
  const uniqueVendors = new Set(allProducts.map(p => p.vendor_id)).size;

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('products').update({ status: 'approved' }).eq('id', id);
    if (!error) {
      setPendingProducts(prev => prev.filter(p => p.id !== id));
      setAllProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
      toast({ title: 'Product Approved ✅', description: 'The listing is now live in the marketplace.' });
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('products').update({ status: 'rejected' }).eq('id', id);
    if (!error) {
      setPendingProducts(prev => prev.filter(p => p.id !== id));
      setAllProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
      toast({ title: 'Product Rejected', description: 'The vendor will be notified.', variant: 'destructive' });
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setActionLoading(null);
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
        <motion.div className="absolute inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/10 via-accent/5 to-background" />
        </motion.div>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <motion.div className="flex items-center justify-between mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
                <p className="text-sm text-foreground/50">SWYF Marketplace Management</p>
              </div>
            </div>
            <button onClick={fetchAll} className="px-4 py-2 rounded-xl bg-foreground/5 text-foreground/60 text-sm hover:bg-foreground/10 transition-all flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </motion.div>

          {/* Metric Cards */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {[
              { icon: Package, label: 'Total Products', value: totalProducts, color: 'from-blue-500 to-cyan-500' },
              { icon: CheckCircle, label: 'Approved', value: approvedCount, color: 'from-green-500 to-emerald-500' },
              { icon: Clock, label: 'Pending Approval', value: pendingCount, color: 'from-yellow-500 to-amber-500' },
              { icon: Users, label: 'Active Vendors', value: uniqueVendors, color: 'from-purple-500 to-pink-500' },
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
              { key: 'approvals', label: `Pending Approvals (${pendingCount})`, icon: Clock },
              { key: 'all-products', label: 'All Products', icon: Package },
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
            {/* APPROVALS TAB */}
            {activeTab === 'approvals' && (
              <motion.div key="approvals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {isLoading ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40 mb-3" />
                    <p className="text-sm text-foreground/40">Loading pending approvals...</p>
                  </div>
                ) : pendingProducts.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-400/40 mb-4" />
                    <p className="text-foreground/50 text-lg font-medium">All caught up!</p>
                    <p className="text-foreground/30 text-sm mt-1">No pending product approvals right now.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingProducts.map(product => (
                      <motion.div
                        key={product.id}
                        layout
                        className="glass-card rounded-2xl p-5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex flex-col md:flex-row gap-5">
                          {/* Product Images */}
                          <div className="flex gap-2 flex-shrink-0">
                            {(() => {
                              let urls: string[] = [];
                              try {
                                if (Array.isArray(product.image_urls)) {
                                  urls = product.image_urls;
                                } else if (typeof product.image_urls === 'string') {
                                  urls = JSON.parse(product.image_urls);
                                }
                              } catch (e) {
                                console.error('Error parsing product images', e);
                              }

                              if (urls.length > 0) {
                                return urls.slice(0, 3).map((url: string, i: number) => (
                                  <div key={i} className="w-20 h-20 rounded-xl overflow-hidden bg-foreground/5 dark:bg-gray-800">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ));
                              }

                              return (
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-foreground/5 dark:bg-gray-800">
                                  <img 
                                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200" 
                                    alt="Proper fashion fallback" 
                                    className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all"
                                  />
                                </div>
                              );
                            })()}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-bold text-lg">{product.name}</h3>
                                <p className="text-sm text-foreground/50 mt-0.5">
                                  by <span className="text-primary font-medium">{product.profiles?.name || 'Unknown Vendor'}</span>
                                </p>
                              </div>
                              <p className="text-xl font-bold text-primary">₹{product.price?.toLocaleString()}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="px-2.5 py-0.5 rounded-full text-xs bg-foreground/5 text-foreground/60">{product.category}</span>
                              {product.fabric && <span className="px-2.5 py-0.5 rounded-full text-xs bg-foreground/5 text-foreground/60">{product.fabric}</span>}
                              {product.sizes && product.sizes.map((s: string) => (
                                <span key={s} className="px-2 py-0.5 rounded text-[10px] bg-foreground/5 text-foreground/40">{s}</span>
                              ))}
                            </div>

                            {product.description && (
                              <p className="text-xs text-foreground/40 mt-2 line-clamp-2">{product.description}</p>
                            )}

                            <p className="text-[10px] text-foreground/30 mt-2">
                              Submitted {new Date(product.created_at).toLocaleDateString()} at {new Date(product.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                          <motion.button
                            onClick={() => handleApprove(product.id)}
                            disabled={actionLoading === product.id}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {actionLoading === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Approve & Publish
                          </motion.button>
                          <motion.button
                            onClick={() => handleReject(product.id)}
                            disabled={actionLoading === product.id}
                            className="px-6 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <X className="h-4 w-4" /> Reject
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ALL PRODUCTS TAB */}
            {activeTab === 'all-products' && (
              <motion.div key="all-products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-semibold text-sm">All Products ({allProducts.length})</h3>
                  </div>

                  {isLoading ? (
                    <div className="p-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40 mb-3" />
                      <p className="text-sm text-foreground/40">Loading products...</p>
                    </div>
                  ) : allProducts.length === 0 ? (
                    <div className="p-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-foreground/20 mb-4" />
                      <p className="text-foreground/50">No products in the database yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {allProducts.map(product => (
                        <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                          {/* Image */}
                          {(() => {
                            let urls: string[] = [];
                            try {
                              if (Array.isArray(product.image_urls)) {
                                urls = product.image_urls;
                              } else if (typeof product.image_urls === 'string') {
                                urls = JSON.parse(product.image_urls);
                              }
                            } catch (e) {}

                            if (urls.length > 0) {
                              return (
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0">
                                  <img src={urls[0]} alt="" className="w-full h-full object-cover" />
                                </div>
                              );
                            }

                            return (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0">
                                <img 
                                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100" 
                                  alt="Proper fallback" 
                                  className="w-full h-full object-cover opacity-50"
                                />
                              </div>
                            );
                          })()}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                            <p className="text-xs text-foreground/40">
                              {product.profiles?.name || 'Unknown'} · {product.category} · ₹{product.price?.toLocaleString()}
                            </p>
                          </div>

                          {/* Status */}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge(product.status)}`}>
                            {product.status}
                          </span>

                          {/* Quick actions for pending */}
                          {product.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleApprove(product.id)} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleReject(product.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
