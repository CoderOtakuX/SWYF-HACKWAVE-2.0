import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { useSkinTone } from '@/contexts/SkinToneContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { applyRewardAction } from '@/lib/rewards';
import {
  ShoppingCart,
  Star,
  Sparkles,
  ChevronLeft,
  Heart,
  Share2,
  Shirt,
  Ruler,
  Package,
  Shield,
  Truck,
  RotateCcw,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { MOCK_PRODUCTS, calculateMatchScore } from '@/data/marketplaceData';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { skinToneData } = useSkinTone();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      // Check mock first
      const mockProd = MOCK_PRODUCTS.find(p => p.id === id);
      if (mockProd) {
        setProduct(mockProd);
        setIsLoading(false);
        return;
      }

      // Check DB if not in mock
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(name)')
        .eq('id', id)
        .single();
        
      if (data) {
        let urls: string[] = [];
        try {
          if (Array.isArray(data.image_urls)) {
            urls = data.image_urls;
          } else if (typeof data.image_urls === 'string') {
            urls = JSON.parse(data.image_urls);
          }
        } catch (e) {}

        const actualImg = urls.length > 0 ? urls[0] : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80';

        setProduct({
          id: data.id,
          name: data.name,
          brand: data.profiles?.name || 'SWYF Vendor',
          price: data.price,
          imageUrl: actualImg,
          sizes: data.sizes || ['M', 'L'],
          rating: 4.5,
          reviews: 0,
          category: data.category,
          fabric: data.fabric,
          colorTags: data.color_tags ? (typeof data.color_tags === 'string' ? data.color_tags.split(',') : data.color_tags) : [],
        });
      }
      setIsLoading(false);
    };

    if (id) loadProduct();
  }, [id]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Review states
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      fetchReviews();
    }
  }, [product]);

  const fetchReviews = async () => {
    if (!product) return;
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(name)')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-32 pb-20 text-center">
          <p className="text-foreground/50">Loading product...</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/marketplace" className="text-primary hover:underline">← Back to Marketplace</Link>
        </div>
      </Layout>
    );
  }

  const matchScore = calculateMatchScore(skinToneData?.season, skinToneData?.tone, product);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({ title: 'Select a Size', description: 'Please pick a size before adding to cart.', variant: 'destructive' });
      return;
    }
    addItem({
      id: product!.id + '-' + selectedSize,
      name: product!.name,
      brand: product!.brand,
      price: product!.price,
      size: selectedSize,
      imageUrl: product!.imageUrl,
      quantity,
    });
    toast({ title: 'Added to Cart 🛒', description: `${product!.name} (${selectedSize}) × ${quantity}` });
    const reward = applyRewardAction(user?.id ?? 'guest', 'add_to_cart', { dedupeKey: product!.id });
    if (!reward.skipped) {
      toast({ title: 'Tokens Earned', description: reward.message });
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast({ title: 'Select a Size', description: 'Please pick a size before buying.', variant: 'destructive' });
      return;
    }
    handleAddToCart();
    navigate('/cart');
  };

  const submitReview = async () => {
    if (!user) {
      toast({ title: 'Sign In Required', description: 'You must be signed in to leave a review.', variant: 'destructive' });
      return;
    }
    if (!newComment.trim()) {
      toast({ title: 'Comment Required', description: 'Please write a simple review.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    // Since some MOCK_PRODUCT ids aren't UUIDs, this might fail on strict UUID col types.
    // Assuming product_id in Supabase allows text OR these are actual UUIDs. 
    // In our plan it was UUID. We will attempt insertion.
    const { error } = await supabase.from('reviews').insert([{
      product_id: product!.id,
      user_id: user.id,
      rating: newRating,
      comment: newComment
    }]);

    if (!error) {
      const reward = applyRewardAction(user.id, 'review', { dedupeKey: product!.id });
      toast({ title: 'Review Posted', description: 'Thank you for your feedback!' });
      if (!reward.skipped) {
        toast({ title: 'Tokens Earned', description: reward.message });
      }
      setNewComment('');
      setNewRating(5);
      fetchReviews();
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  // Related products (same brand or category, excluding current)
  const related = MOCK_PRODUCTS.filter(p => p.id !== product.id && (p.brand === product.brand || p.category === product.category)).slice(0, 4);

  return (
    <Layout>
      <div className="pt-28 pb-20">
        <motion.div className="absolute inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-accent/5 to-background" />
        </motion.div>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Breadcrumb */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
            <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back to Marketplace
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Image */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="glass-card rounded-2xl overflow-hidden relative">
                <div className="aspect-[3/4] bg-foreground/5">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = '/assets/marketplace/product-fallback.svg';
                    }}
                  />
                </div>
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.originalPrice && (
                    <span className="px-3 py-1 text-xs font-bold bg-red-500 text-white rounded-full shadow-lg">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </span>
                  )}
                  {matchScore && matchScore >= 80 && (
                    <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {matchScore}% Chromatch
                    </span>
                  )}
                </div>
                {/* Quick Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="p-2.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all"
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                  </button>
                  <button className="p-2.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all">
                    <Share2 className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right: Details */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-col">
              {/* Brand */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{product.brandLogo}</span>
                <span className="text-sm text-foreground/60 font-medium">{product.brand}</span>
              </div>

              {/* Name */}
              <h1 className="text-3xl font-display font-bold mb-3">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400/10">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{product.rating}</span>
                </div>
                <span className="text-sm text-foreground/50">({product.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-foreground/40 line-through">₹{product.originalPrice.toLocaleString()}</span>
                    <span className="text-sm font-semibold text-green-500">
                      Save ₹{(product.originalPrice - product.price).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* Skin Tone Match Card */}
              {matchScore && matchScore >= 70 && (
                <div className="glass-morphism rounded-xl p-4 mb-6 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {matchScore}% Chromatch with your <span className="text-primary">{skinToneData?.season}</span> profile
                      </p>
                      <p className="text-xs text-foreground/50">This item's colors are highly complementary to your skin tone</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-foreground/70 text-sm mb-6">{product.description}</p>

              {/* Size Selection */}
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-foreground/40" /> Select Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 text-sm rounded-xl font-medium transition-all ${selectedSize === size
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-foreground/5 text-foreground/70 hover:bg-primary/10 hover:text-primary border border-white/10'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-lg bg-foreground/5 text-foreground/70 hover:bg-primary/10 transition-colors flex items-center justify-center font-bold"
                  >−</button>
                  <span className="w-10 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 rounded-lg bg-foreground/5 text-foreground/70 hover:bg-primary/10 transition-colors flex items-center justify-center font-bold"
                  >+</button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <motion.button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 rounded-xl font-semibold bg-foreground/5 text-foreground hover:bg-foreground/10 transition-all flex items-center justify-center gap-2 border border-white/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingCart className="h-5 w-5" /> Add to Cart
                </motion.button>
                <motion.button
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Zap className="h-5 w-5" /> Buy Now
                </motion.button>
              </div>

              {/* Try On CTA */}
              <Link
                to="/projects"
                className="glass-card rounded-xl p-4 flex items-center gap-3 mb-6 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-green flex items-center justify-center">
                  <Shirt className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Virtual Try-On Available</p>
                  <p className="text-xs text-foreground/50">See how this looks on you with our AR camera</p>
                </div>
                <ChevronLeft className="h-5 w-5 rotate-180 text-foreground/30 group-hover:text-primary transition-colors" />
              </Link>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Truck, label: 'Free Delivery', sub: 'Orders above ₹999' },
                  { icon: RotateCcw, label: 'Easy Returns', sub: '7-day return policy' },
                  { icon: Shield, label: 'Secure Pay', sub: 'Razorpay protected' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="text-center p-3 rounded-xl bg-foreground/5">
                    <Icon className="h-5 w-5 mx-auto mb-1 text-foreground/40" />
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-foreground/40">{sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Fabric & Details */}
          <motion.div
            className="mt-12 glass-card rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-lg font-bold mb-4">Product Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-foreground/40">Fabric</span><p className="font-medium">{product.fabric}</p></div>
              <div><span className="text-foreground/40">Category</span><p className="font-medium">{product.category}</p></div>
              <div><span className="text-foreground/40">Colors</span><p className="font-medium">{product.colorTags.join(', ')}</p></div>
              <div>
                <span className="text-foreground/40">Dominant Color</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: product.dominantColor }} />
                  <span className="font-medium font-mono text-xs">{product.dominantColor}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Reviews Section */}
          <motion.div
            className="mt-12 glass-card rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Customer Reviews</h2>
            
            {/* Review Form */}
            {user ? (
              <div className="mb-8 p-4 rounded-xl bg-foreground/5 border border-white/5">
                <h3 className="text-sm font-semibold mb-3">Write a Review</h3>
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setNewRating(star)}>
                      <Star className={`h-6 w-6 transition-all ${newRating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-foreground/30 hover:text-yellow-400/50'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="What did you like about this product?"
                  className="w-full bg-background rounded-lg p-3 text-sm border border-white/10 focus:border-primary/50 outline-none resize-none mb-3"
                  rows={3}
                />
                <button
                  onClick={submitReview}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post Review'}
                </button>
              </div>
            ) : (
              <div className="mb-8 p-4 rounded-xl bg-foreground/5 border border-white/5 text-center">
                <p className="text-sm text-foreground/60 mb-2">Sign in to leave a review</p>
                <Link to="/" className="text-primary text-sm font-medium hover:underline">Go to Sign In</Link>
              </div>
            )}

            {/* Review List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-foreground/50 text-sm italic">No reviews yet. Be the first!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center text-white font-bold text-xs">
                          {review.profiles?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{review.profiles?.name || 'Unknown User'}</p>
                          <p className="text-[10px] text-foreground/40">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-foreground/20'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 pl-10">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Related Products */}
          {related.length > 0 && (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-xl font-bold mb-6">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map(p => (
                  <Link key={p.id} to={`/marketplace/${p.id}`} className="glass-card rounded-xl overflow-hidden hover:shadow-lg transition-all group">
                    <div className="aspect-square bg-foreground/5">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-foreground/50">{p.brand}</p>
                      <p className="text-sm font-semibold line-clamp-1">{p.name}</p>
                      <p className="text-sm font-bold mt-1">₹{p.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default ProductDetail;
