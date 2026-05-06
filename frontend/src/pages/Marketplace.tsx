import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useSkinTone } from '@/contexts/SkinToneContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { applyRewardAction } from '@/lib/rewards';
import {
  Search,
  ShoppingCart,
  Star,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Store,
  X,
  Heart,
  Eye,
  ShoppingBag,
  TrendingUp,
  Clock,
  Flame,
  Loader2,
} from 'lucide-react';
import { MOCK_PRODUCTS, VENDORS, calculateMatchScore, type MarketplaceProduct } from '@/data/marketplaceData';

const CATEGORIES = ['All', 'MENS', 'WOMENS', 'UNISEX'] as const;
const SORT_OPTIONS = [
  { value: 'trending', label: '🔥 Trending', icon: Flame },
  { value: 'newest', label: '🆕 Latest', icon: Clock },
  { value: 'recommended', label: '✨ For You', icon: Sparkles },
  { value: 'price-asc', label: 'Price ↑', icon: TrendingUp },
  { value: 'price-desc', label: 'Price ↓', icon: TrendingUp },
  { value: 'rating', label: '⭐ Top Rated', icon: Star },
] as const;

const Marketplace = () => {
  const { skinToneData } = useSkinTone();
  const { addItem, totalItems } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 6000]);
  const [skinToneFilterOnly, setSkinToneFilterOnly] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(true);

  // Fetch approved products from Supabase
  useEffect(() => {
    const fetchApproved = async () => {
      const normalizeRows = (rows: any[] = []) => rows.map(p => ({
        ...p,
        profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
      }));

      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (data) {
        setLiveProducts(normalizeRows(data));
        setIsLoadingLive(false);
        return;
      }

      if (error) {
        console.error('Error fetching approved products with profile join:', error);
        const fallback = await supabase
          .from('products')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (fallback.data) setLiveProducts(normalizeRows(fallback.data));
        if (fallback.error) console.error('Error fetching approved products:', fallback.error);
      }
      setIsLoadingLive(false);
    };
    fetchApproved();
  }, []);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const reward = applyRewardAction(user?.id ?? 'guest', 'save_item', { dedupeKey: id });
        if (!reward.skipped) {
          toast({ title: 'Tokens Earned', description: reward.message });
        }
      }
      return next;
    });
  };

  // Merge mock + live products into unified format
  const allProducts = useMemo(() => {
    // Convert live Supabase products to match MarketplaceProduct shape
    const convertedLive = liveProducts.map(p => {
      let urls: string[] = [];
      try {
        if (Array.isArray(p.image_urls)) {
          urls = p.image_urls;
        } else if (typeof p.image_urls === 'string') {
          urls = JSON.parse(p.image_urls);
        }
      } catch (e) {
        // Fallback for empty or malformed
      }
      
      const defaultImg = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80';
      const actualImg = urls.length > 0 ? urls[0] : defaultImg;

      return {
        id: p.id,
        name: p.name,
        brand: p.profiles?.name || 'SWYF Vendor',
        brandLogo: '🏪',
        category: p.category || 'UNISEX',
        price: p.price,
        originalPrice: undefined,
        imageUrl: actualImg,
        sizes: p.sizes || ['M', 'L'],
        rating: 4.5,
        reviews: 0,
        colorTags: p.color_tags ? (typeof p.color_tags === 'string' ? p.color_tags.split(',').map((s: string) => s.trim()) : p.color_tags) : [],
        fabric: p.fabric || '',
        skinToneTags: [],
        matchScore: 0,
        isLive: true,
        created_at: p.created_at,
      };
    });

    // Add match scores to mock products
    const scoredMock = MOCK_PRODUCTS.map(p => ({
      ...p,
      matchScore: calculateMatchScore(skinToneData?.season, skinToneData?.tone, p),
      isLive: false,
      created_at: '2026-04-10T00:00:00Z',
    }));

    return [...convertedLive, ...scoredMock];
  }, [liveProducts, skinToneData]);

  // Filter & sort
  const filteredProducts = useMemo(() => {
    let result = allProducts;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.colorTags && p.colorTags.some((c: string) => c.toLowerCase().includes(q))) ||
        (p.fabric && p.fabric.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Brand
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // Price
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Skin tone filter
    if (skinToneFilterOnly && skinToneData) {
      result = result.filter(p => (p.matchScore ?? 0) >= 80);
    }

    // Sort
    switch (sortBy) {
      case 'trending':
        result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result = [...result].sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });
        break;
      case 'recommended':
        result = [...result].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
        break;
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }

    return result;
  }, [allProducts, searchQuery, selectedCategory, selectedBrands, priceRange, skinToneFilterOnly, skinToneData, sortBy]);

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      size: product.sizes?.[1] || product.sizes?.[0] || 'M',
      imageUrl: product.imageUrl,
      quantity: 1,
    });
    toast({ title: 'Added to Cart 🛒', description: `${product.name} has been added to your cart.` });
    const reward = applyRewardAction(user?.id ?? 'guest', 'add_to_cart', { dedupeKey: product.id });
    if (!reward.skipped) {
      toast({ title: 'Tokens Earned', description: reward.message });
    }
  };

  // All unique brands from combined products
  const allBrands = useMemo(() => {
    const brands = new Set(allProducts.map(p => p.brand));
    return Array.from(brands);
  }, [allProducts]);

  return (
    <Layout>
      <div className="pt-32 pb-20">
        {/* Background */}
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-accent/10 to-background" />
        </motion.div>

        {/* Hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium inline-block mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <Store className="inline h-3 w-3 mr-1" /> SWYF Marketplace
            </motion.span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Shop <span className="text-gradient">Smarter</span>, Not Harder
            </h1>
            <p className="text-lg text-foreground/70">
              Browse curated collections from top brands. Try on virtually. Buy with confidence.
            </p>
          </motion.div>

          {/* Skin Tone Banner */}
          {skinToneData && (
            <motion.div
              className="glass-morphism rounded-2xl p-4 mb-8 flex items-center justify-between max-w-3xl mx-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Personalized for your <span className="text-primary">{skinToneData.season}</span> profile</p>
                  <p className="text-xs text-foreground/60">Items tagged with ✨ Chromatch are curated for your skin tone</p>
                </div>
              </div>
              <div className="flex gap-1">
                {skinToneData.recommendedColors?.slice(0, 4).map((c: string, i: number) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* Search & Filters Bar */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="glass-card rounded-2xl p-4 mb-6">
            {/* Top row: Search */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search kurtas, denim, silk, brands..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-4 w-4 text-foreground/40 hover:text-foreground" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-xl border transition-all ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background/60 border-white/10 text-foreground/70 hover:border-primary/20'}`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </button>

                <Link to="/cart" className="relative p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${selectedCategory === cat
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-background/60 text-foreground/60 hover:bg-primary/10'
                    }`}
                >
                  {cat === 'All' ? '🔥 All' : cat === 'MENS' ? '👔 Men' : cat === 'WOMENS' ? '👗 Women' : '⚡ Unisex'}
                </button>
              ))}

              {skinToneData && (
                <button
                  onClick={() => setSkinToneFilterOnly(!skinToneFilterOnly)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${skinToneFilterOnly
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                    : 'bg-background/60 text-foreground/60 hover:bg-primary/10'
                    }`}
                >
                  <Sparkles className="h-3 w-3" /> Skin-Tone Matched
                </button>
              )}
            </div>

            {/* Sort Toggle Bar */}
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${sortBy === opt.value
                    ? 'bg-foreground/10 text-foreground border border-white/20'
                    : 'text-foreground/40 hover:text-foreground/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 mb-2 uppercase tracking-wider">Brands</p>
                    <div className="flex flex-wrap gap-2">
                      {allBrands.map(brand => (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className={`px-3 py-1.5 text-xs rounded-full transition-all ${selectedBrands.includes(brand)
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-background/50 text-foreground/60 border border-white/10 hover:border-primary/20'
                            }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground/50 mb-2 uppercase tracking-wider">
                      Price: ₹{priceRange[0]} — ₹{priceRange[1]}
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={6000}
                      step={100}
                      value={priceRange[1]}
                      onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-primary"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Product Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-foreground/60">
              Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> item{filteredProducts.length !== 1 ? 's' : ''}
              {liveProducts.length > 0 && <span className="text-primary ml-1">({liveProducts.length} vendor listings)</span>}
            </p>
          </div>

          {isLoadingLive ? (
            <div className="text-center py-20">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40 mb-3" />
              <p className="text-foreground/40 text-sm">Loading marketplace...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="mx-auto h-12 w-12 text-foreground/20 mb-4" />
              <p className="text-foreground/50 text-lg">No products match your filters</p>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedBrands([]); setSkinToneFilterOnly(false); }} className="mt-4 px-4 py-2 text-sm text-primary hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="group"
                  >
                    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                      {/* Image */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-foreground/5">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = '/assets/marketplace/product-fallback.svg';
                          }}
                        />

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Top badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {product.isLive && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                              NEW LISTING
                            </span>
                          )}
                          {product.originalPrice && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                              {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                            </span>
                          )}
                          {product.matchScore && product.matchScore >= 80 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-primary to-accent text-white rounded-full flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" /> {product.matchScore}% Match
                            </span>
                          )}
                        </div>

                        {/* Wishlist */}
                        <button
                          onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all"
                        >
                          <Heart className={`h-4 w-4 ${wishlist.has(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </button>

                        {/* Bottom hover buttons */}
                        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <Link
                            to={`/marketplace/${product.id}`}
                            className="flex-1 py-2 text-xs font-semibold text-center bg-white text-black rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Link>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 py-2 text-xs font-semibold text-center bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" /> Add
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-foreground/50">{product.brandLogo || '🏪'} {product.brand}</span>
                        </div>
                        <Link to={`/marketplace/${product.id}`}>
                          <h3 className="font-semibold text-sm mb-2 hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                        </Link>
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-lg">₹{product.price.toLocaleString()}</span>
                            {product.originalPrice && (
                              <span className="text-xs text-foreground/40 line-through">₹{product.originalPrice.toLocaleString()}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-foreground/50">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {product.rating}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.sizes?.map((s: string) => (
                            <span key={s} className="px-1.5 py-0.5 text-[10px] rounded bg-foreground/5 text-foreground/50">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Vendor Showcase */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mt-16">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-display font-bold mb-2">Our Partner Brands</h2>
            <p className="text-foreground/60 text-sm">Trusted vendors bringing you authentic, quality fashion</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VENDORS.map((vendor, i) => (
              <motion.div
                key={vendor.id}
                className="glass-card rounded-2xl p-6 text-center hover:shadow-lg transition-all cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => { setSelectedBrands([vendor.name]); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <div className="text-4xl mb-3">{vendor.logo}</div>
                <h3 className="font-bold text-lg mb-1">{vendor.name}</h3>
                <p className="text-xs text-foreground/60">{vendor.tagline}</p>
                <p className="mt-3 text-xs text-primary font-medium">
                  {MOCK_PRODUCTS.filter(p => p.brand === vendor.name).length} products →
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mt-16">
          <motion.div
            className="glass-morphism rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-background" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Want to Sell on SWYF?
              </h2>
              <p className="text-foreground/70 mb-6">
                List your brand's apparel and reach thousands of shoppers who can try before they buy. Only 8% commission per sale.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/vendor"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
                >
                  Become a Vendor <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
    </Layout>
  );
};

export default Marketplace;
