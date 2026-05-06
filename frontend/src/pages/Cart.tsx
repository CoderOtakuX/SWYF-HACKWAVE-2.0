import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  ShoppingBag,
  Tag,
  Truck,
  Shield,
  ArrowRight,
} from 'lucide-react';

const Cart = () => {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const platformFee = 0; // Free for buyers
  const deliveryCharge = totalPrice >= 999 ? 0 : 79;
  const grandTotal = totalPrice + platformFee + deliveryCharge;

  return (
    <Layout>
      <div className="pt-28 pb-20">
        <motion.div className="absolute inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-accent/5 to-background" />
        </motion.div>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
            <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" /> Continue Shopping
            </Link>
          </motion.div>

          <motion.h1
            className="text-3xl font-display font-bold mb-8 flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShoppingCart className="h-7 w-7 text-primary" />
            Your Cart <span className="text-foreground/40 text-lg font-normal">({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
          </motion.h1>

          {items.length === 0 ? (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <ShoppingBag className="mx-auto h-16 w-16 text-foreground/15 mb-6" />
              <h2 className="text-xl font-semibold mb-2 text-foreground/60">Your cart is empty</h2>
              <p className="text-foreground/40 mb-6">Discover personalized fashion on our marketplace</p>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-all"
              >
                Explore Marketplace <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="glass-card rounded-2xl p-4 flex gap-4"
                    >
                      {/* Image */}
                      <div className="w-24 h-28 rounded-xl overflow-hidden bg-foreground/5 flex-shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-foreground/50">{item.brand}</p>
                            <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                            <p className="text-xs text-foreground/40 mt-0.5">Size: {item.size}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-foreground/5 hover:bg-primary/10 flex items-center justify-center transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-foreground/5 hover:bg-primary/10 flex items-center justify-center transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button
                  onClick={clearCart}
                  className="text-xs text-foreground/40 hover:text-red-500 transition-colors mt-2"
                >
                  Clear entire cart
                </button>
              </div>

              {/* Order Summary */}
              <motion.div
                className="lg:col-span-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="glass-card rounded-2xl p-6 sticky top-28">
                  <h2 className="font-bold text-lg mb-4">Order Summary</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Subtotal ({totalItems} items)</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Delivery</span>
                      <span className={deliveryCharge === 0 ? 'text-green-500 font-medium' : ''}>
                        {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Platform Fee</span>
                      <span className="text-green-500 font-medium">FREE</span>
                    </div>
                    <div className="border-t border-white/10 pt-3 flex justify-between">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-lg">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {deliveryCharge > 0 && (
                    <p className="text-[10px] text-foreground/40 mt-2 flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Add ₹{(999 - totalPrice).toLocaleString()} more for free delivery
                    </p>
                  )}

                  <motion.button
                    onClick={() => navigate('/checkout')}
                    className="w-full mt-5 py-3.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </motion.button>

                  {/* Trust */}
                  <div className="mt-4 flex items-center gap-2 justify-center text-[10px] text-foreground/40">
                    <Shield className="h-3 w-3" /> Secure checkout powered by Razorpay
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Cart;
