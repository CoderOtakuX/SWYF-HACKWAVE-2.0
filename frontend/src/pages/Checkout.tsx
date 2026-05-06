import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { applyRewardAction } from '@/lib/rewards';
import {
  CreditCard,
  ChevronLeft,
  MapPin,
  Check,
  PartyPopper,
  ShoppingBag,
  Shield,
  Package,
  Clock,
  ArrowRight,
  Truck,
} from 'lucide-react';

const COMMISSION_RATE = 0.08;

// Generate fake order ID
const genOrderId = () => 'SWYF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
const genPaymentId = () => 'pay_' + Math.random().toString(36).substring(2, 14);

interface MockOrder {
  orderId: string;
  paymentId: string;
  items: { name: string; brand: string; size: string; price: number; quantity: number }[];
  gross: number;
  commission: number;
  vendorPayout: number;
  delivery: number;
  total: number;
  address: { name: string; phone: string; line1: string; city: string; pin: string };
  date: string;
}

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [order, setOrder] = useState<MockOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Address form state (pre-filled)
  const [address, setAddress] = useState({
    name: 'Demo Shopper',
    phone: '9876543210',
    line1: '42, MG Road, Indiranagar',
    city: 'Bangalore',
    pin: '560038',
  });

  // Card form state (mock)
  const [card, setCard] = useState({
    number: '4111 1111 1111 1111',
    expiry: '12/28',
    cvv: '123',
    name: 'DEMO SHOPPER',
  });

  const deliveryCharge = totalPrice >= 999 ? 0 : 79;
  const grandTotal = totalPrice + deliveryCharge;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    // Simulate Razorpay processing
    await new Promise(r => setTimeout(r, 2000));

    const gross = totalPrice;
    const commission = Math.round(gross * COMMISSION_RATE);
    const vendorPayout = gross - commission;

    const newOrder: MockOrder = {
      orderId: genOrderId(),
      paymentId: genPaymentId(),
      items: items.map(i => ({ name: i.name, brand: i.brand, size: i.size, price: i.price, quantity: i.quantity })),
      gross,
      commission,
      vendorPayout,
      delivery: deliveryCharge,
      total: grandTotal,
      address,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    };

    // Save to localStorage as order history
    try {
      const existing = JSON.parse(localStorage.getItem('swyf_orders') || '[]');
      existing.push(newOrder);
      localStorage.setItem('swyf_orders', JSON.stringify(existing));
    } catch { /* ignore */ }

    setOrder(newOrder);
    const reward = applyRewardAction(user?.id ?? 'guest', 'checkout', { dedupeKey: newOrder.orderId });
    if (!reward.skipped) {
      toast({ title: 'Tokens Earned', description: reward.message });
    }
    clearCart();
    setStep('success');
    setIsProcessing(false);
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <Layout>
        <div className="pt-32 pb-20 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-foreground/15 mb-6" />
          <h2 className="text-xl font-semibold mb-2 text-foreground/60">Nothing to checkout</h2>
          <Link to="/marketplace" className="text-primary hover:underline">← Go to Marketplace</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-28 pb-20">
        <motion.div className="absolute inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-accent/5 to-background" />
        </motion.div>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          {step !== 'success' && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
              <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-primary transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back to Cart
              </Link>
            </motion.div>
          )}

          {/* Progress */}
          {step !== 'success' && (
            <div className="flex items-center justify-center gap-2 mb-8 text-xs">
              {[
                { key: 'address', label: 'Address', num: 1 },
                { key: 'payment', label: 'Payment', num: 2 },
              ].map(({ key, label, num }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${step === key || (key === 'address' && step === 'payment') ? 'bg-primary text-white' : 'bg-foreground/10 text-foreground/40'}`}>
                    {(key === 'address' && step === 'payment') ? <Check className="h-4 w-4" /> : num}
                  </span>
                  <span className={`font-medium ${step === key ? 'text-foreground' : 'text-foreground/40'}`}>{label}</span>
                  {key === 'address' && <div className="w-12 h-0.5 bg-foreground/10 mx-1" />}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ADDRESS STEP */}
            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Delivery Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-foreground/50 mb-1 block">Full Name</label>
                      <input value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-foreground/50 mb-1 block">Phone</label>
                      <input value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-foreground/50 mb-1 block">Address Line</label>
                      <input value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-foreground/50 mb-1 block">City</label>
                        <input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-foreground/50 mb-1 block">Pincode</label>
                        <input value={address.pin} onChange={e => setAddress({ ...address, pin: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setStep('payment')}
                    className="w-full mt-6 py-3.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue to Payment <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* PAYMENT STEP */}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" /> Payment
                  </h2>
                  <p className="text-xs text-foreground/40 mb-4 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Razorpay Test Mode — No real money will be charged
                  </p>

                  {/* Order Summary mini */}
                  <div className="bg-foreground/5 rounded-xl p-4 mb-5 text-sm space-y-2">
                    {items.map(i => (
                      <div key={i.id} className="flex justify-between">
                        <span className="text-foreground/60 truncate max-w-[200px]">{i.name} × {i.quantity}</span>
                        <span>₹{(i.price * i.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Mock Card Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-foreground/50 mb-1 block">Card Number</label>
                      <input value={card.number} onChange={e => setCard({ ...card, number: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none font-mono" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-foreground/50 mb-1 block">Expiry</label>
                        <input value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="text-xs text-foreground/50 mb-1 block">CVV</label>
                        <input value={card.cvv} onChange={e => setCard({ ...card, cvv: e.target.value })} type="password" className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="text-xs text-foreground/50 mb-1 block">Name</label>
                        <input value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setStep('address')} className="px-6 py-3.5 rounded-xl font-medium bg-foreground/5 text-foreground/60 hover:bg-foreground/10 transition-all">
                      Back
                    </button>
                    <motion.button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                      className="flex-1 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                      whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                      whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>Pay ₹{grandTotal.toLocaleString()}</>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUCCESS */}
            {step === 'success' && order && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.3 }}>
                <div className="glass-card rounded-2xl p-8 text-center relative overflow-hidden">
                  {/* Confetti-like decoration */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][i % 6],
                          left: `${Math.random() * 100}%`,
                          top: `-5%`,
                        }}
                        animate={{
                          y: ['0vh', '100vh'],
                          x: [0, (Math.random() - 0.5) * 100],
                          rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                          opacity: [1, 0],
                        }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          delay: Math.random() * 0.5,
                          ease: 'easeOut',
                        }}
                      />
                    ))}
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20"
                  >
                    <Check className="h-10 w-10 text-white" />
                  </motion.div>

                  <h1 className="text-2xl font-display font-bold mb-2">Order Confirmed! 🎉</h1>
                  <p className="text-foreground/60 mb-6">Thank you for shopping with SWYF</p>

                  <div className="bg-foreground/5 rounded-xl p-5 text-sm text-left space-y-3 mb-6 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-foreground/50">Order ID</span>
                      <span className="font-mono font-semibold">{order.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/50">Payment ID</span>
                      <span className="font-mono text-xs">{order.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/50">Date</span>
                      <span>{order.date}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between">
                      <span className="text-foreground/50">Amount Paid</span>
                      <span className="font-bold text-lg">₹{order.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Commission breakdown (visible for demo) */}
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-xs text-left max-w-md mx-auto mb-6">
                    <p className="font-semibold text-primary mb-2">📊 Platform Economics (Demo View)</p>
                    <div className="space-y-1 text-foreground/60">
                      <div className="flex justify-between"><span>Gross Order Value</span><span>₹{order.gross.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Platform Commission (8%)</span><span className="text-primary font-medium">₹{order.commission.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Vendor Payout</span><span>₹{order.vendorPayout.toLocaleString()}</span></div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="text-left max-w-md mx-auto mb-6">
                    <p className="font-semibold text-sm mb-2">Items Ordered</p>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-foreground/70">{item.name} ({item.size}) × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-center">
                    <Link
                      to="/marketplace"
                      className="px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-all"
                    >
                      Continue Shopping
                    </Link>
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

export default Checkout;
