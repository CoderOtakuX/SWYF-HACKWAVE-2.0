import { useState, useEffect, useRef } from "react";
import { Menu, X, User, LogOut, Store, Shield, ChevronDown, ShoppingCart, LayoutDashboard, Package, ShoppingBag, IndianRupee, ClipboardCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import LoginModal from "@/components/LoginModal";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowProfileDropdown(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path ? "text-primary" : "text-foreground/80";
  };

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
    navigate('/');
  };

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/vendor';
  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Vendor';
  const roleColor = user?.role === 'admin' ? 'from-red-500 to-orange-500' : 'from-purple-500 to-pink-500';

  // ── Nav links based on auth state ──
  const publicLinks = [
    { to: '/features', label: 'Features', hoverColor: 'hover:text-brand-teal' },
    { to: '/how-it-works', label: 'How It Works', hoverColor: 'hover:text-brand-green' },
    { to: '/business-model', label: 'Business Model', hoverColor: 'hover:text-brand-pink' },
    { to: '/projects', label: 'Projects', hoverColor: 'hover:text-brand-yellow' },
    { to: '/marketplace', label: 'Marketplace', hoverColor: 'hover:text-brand-teal' },
    { to: '/rewards', label: 'Rewards', hoverColor: 'hover:text-brand-orange' },
  ];

  const vendorLinks = [
    { to: '/vendor', label: 'Dashboard', hoverColor: 'hover:text-purple-400' },
    { to: '/marketplace', label: 'Marketplace', hoverColor: 'hover:text-brand-teal' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', hoverColor: 'hover:text-red-400' },
    { to: '/marketplace', label: 'Marketplace', hoverColor: 'hover:text-brand-teal' },
  ];

  const navLinks = !user ? publicLinks : user.role === 'admin' ? adminLinks : vendorLinks;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-12 ${isScrolled ? `py-4 ${isDarkMode ? "bg-background/80" : "bg-white/80"} backdrop-blur-lg shadow-sm` : "py-6 bg-transparent"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/assets/logo.png" alt="SWYF Logo" className="h-14 w-22" />
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium ${isActive(link.to)} ${link.hoverColor} transition-colors`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />

            {/* Cart Icon (always visible on marketplace) */}
            <Link to="/cart" className="relative p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors">
              <ShoppingCart className="h-4 w-4 text-foreground/60" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white">
                  {totalItems}
                </span>
              )}
            </Link>
            
            {user ? (
              /* Logged-in: Profile Pill */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-white/10 transition-all"
                >
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-xs font-bold`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className={`h-3 w-3 text-foreground/40 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-56 glass-morphism rounded-2xl shadow-2xl shadow-black/30 border border-white/10 overflow-hidden py-2"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-foreground/40 truncate">{user.email}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.role === 'admin' ? 'bg-red-500/10 text-red-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {roleLabel}
                        </span>
                      </div>
                      {/* Links */}
                      <div className="py-1">
                        <Link
                          to={dashboardPath}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/70 hover:bg-white/5 hover:text-foreground transition-colors"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          {roleLabel} Dashboard
                        </Link>
                        <Link
                          to="/marketplace"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/70 hover:bg-white/5 hover:text-foreground transition-colors"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Marketplace
                        </Link>
                        <Link
                          to="/cart"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/70 hover:bg-white/5 hover:text-foreground transition-colors"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Cart {totalItems > 0 && <span className="ml-auto text-xs text-primary">({totalItems})</span>}
                        </Link>
                      </div>
                      {/* Logout */}
                      <div className="border-t border-white/5 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Not logged in: Sign In button */
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5"
              >
                <User className="h-3.5 w-3.5" />
                Sign In
              </button>
            )}
          </div>
          
          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            {totalItems > 0 && (
              <Link to="/cart" className="relative p-2">
                <ShoppingCart className="h-5 w-5 text-foreground/60" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white">{totalItems}</span>
              </Link>
            )}
            <button className="text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && <div className={`absolute top-full left-0 right-0 ${isDarkMode ? "bg-background" : "bg-white"} shadow-lg py-4 px-6 md:hidden`}>
            <nav className="flex flex-col space-y-4">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium ${isActive(link.to)} ${link.hoverColor} transition-colors`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 flex flex-col space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-foreground/5">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-sm font-bold`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-[10px] text-foreground/40">{roleLabel}</p>
                      </div>
                    </div>
                    <Link to={dashboardPath} className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium text-center transition-colors">
                      {roleLabel} Dashboard
                    </Link>
                    <button onClick={handleLogout} className="px-4 py-2 rounded-full bg-red-500/10 text-red-400 text-sm font-medium text-center transition-colors">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setShowLoginModal(true); }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-medium text-center"
                  >
                    Sign In / Sign Up
                  </button>
                )}
              </div>
            </nav>
          </div>}
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};

export default Navbar;
