import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  X,
  Mail,
  Lock,
  User,
  Store,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const { login, register, isLoading, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'vendor' | 'admin'>('vendor');
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    if (mode === 'login') {
      success = await login(email, password);
    } else {
      success = await register(name, email, password, role);
    }
    if (success) {
      onClose();
      setName('');
      setEmail('');
      setPassword('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md glass-morphism rounded-3xl shadow-2xl shadow-black/40 overflow-hidden relative"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', bounce: 0.25 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Top Gradient Accent */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-purple-500" />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-foreground/50 hover:text-foreground transition-all z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/20"
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: 'spring' }}
                  >
                    <Sparkles className="h-7 w-7 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-display font-bold">
                    {mode === 'login' ? 'Welcome Back' : 'Join SWYF'}
                  </h2>
                  <p className="text-sm text-foreground/50 mt-1">
                    {mode === 'login'
                      ? 'Sign in to your vendor or admin account'
                      : 'Create your account to start selling or managing'}
                  </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-foreground/5 rounded-xl p-1 mb-6">
                  {(['login', 'signup'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-foreground/50 hover:text-foreground/80'
                      }`}
                    >
                      {m === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Role Selection (Only shown on Login) */}
                  <AnimatePresence mode="wait">
                    {mode === 'login' ? (
                      <motion.div
                        key="role-select"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="text-xs text-foreground/50 mb-2 block">I am a</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setRole('vendor')}
                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${role === 'vendor'
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                              : 'bg-foreground/5 border-white/10 text-foreground/50 hover:border-purple-500/20'
                            }`}
                          >
                            <Store className="h-4 w-4" />
                            Vendor
                          </button>
                          <button
                            type="button"
                            onClick={() => setRole('admin')}
                            className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${role === 'admin'
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : 'bg-foreground/5 border-white/10 text-foreground/50 hover:border-red-500/20'
                            }`}
                          >
                            <Shield className="h-4 w-4" />
                            Admin
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* Hidden bit to ensure role is vendor on signup */
                      <div key="role-placeholder" className="hidden" />
                    )}
                  </AnimatePresence>

                  {/* Name (signup only) */}
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="text-xs text-foreground/50 mb-1.5 block">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Your full name"
                            required={mode === 'signup'}
                            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div>
                    <label className="text-xs text-foreground/50 mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs text-foreground/50 mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={4}
                        className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-background/60 border border-white/10 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                      </>
                    ) : mode === 'login' ? (
                      'Sign In'
                    ) : (
                      'Create Account'
                    )}
                  </motion.button>
                </form>

                {/* Footer */}
                <p className="text-center text-xs text-foreground/30 mt-5">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-primary hover:underline font-medium"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
