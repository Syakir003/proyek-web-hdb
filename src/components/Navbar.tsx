import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingCart, User, Menu, X, LogOut, Phone,
  ChevronDown, BookOpen, Briefcase, Info, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  authToken?: string | null;
  userRole?: "admin" | "user" | "teknisi" | null;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  cartCount?: number;
}

const mainNavItems = [
  { id: "beranda", label: "Beranda" },
  { id: "katalog", label: "Produk" },
  { id: "layanan", label: "Layanan" },
  { id: "kontak",  label: "Kontak" },
];

const infoItems = [
  { id: "tentang", label: "Tentang Kami", icon: Info,      desc: "Kisah & visi kami" },
  { id: "blog",    label: "Blog & Tips",  icon: BookOpen,  desc: "Tips perawatan AC terbaik" },
  { id: "karir",   label: "Karir",        icon: Briefcase, desc: "Bergabung bersama tim kami" },
];

export default function Navbar({
  currentPage, setCurrentPage,
  isMobileMenuOpen, setIsMobileMenuOpen,
  authToken, userRole, onLogout, onOpenLogin,
  cartCount = 0,
}: NavbarProps) {
  const [scrolled, setScrolled]         = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredNav, setHoveredNav]     = useState<string | null>(null);
  const [prevCount, setPrevCount]       = useState(cartCount);
  const [cartPulse, setCartPulse]       = useState(false);
  const dropdownRef                     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (cartCount > prevCount) {
      setCartPulse(true);
      const t = setTimeout(() => setCartPulse(false), 700);
      return () => clearTimeout(t);
    }
    setPrevCount(cartCount);
  }, [cartCount, prevCount]);

  const isHome        = currentPage === "beranda";
  const isTransparent = isHome && !scrolled;
  const isInfoActive  = infoItems.some(i => i.id === currentPage);
  const navHeight     = scrolled ? 64 : 80;

  const navigate = (page: string) => {
    setCurrentPage(page);
    setDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const CartBadge = ({ mobile = false }: { mobile?: boolean }) => (
    <motion.button
      onClick={() => navigate("cart")}
      animate={cartPulse ? { scale: [1, 1.3, 0.88, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-xl transition-all ${
        mobile ? "p-2" : "p-2.5"
      } ${
        isTransparent
          ? "text-white hover:bg-white/15"
          : "text-slate-600 hover:bg-sky-50 hover:text-sky-500"
      }`}
    >
      <ShoppingCart className="w-5 h-5" />
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.span
            key={cartCount}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-md px-1 leading-none"
          >
            {cartCount > 9 ? "9+" : cartCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );

  return (
    <>
      <motion.nav
        animate={{ height: navHeight }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          isTransparent
            ? "bg-transparent"
            : "bg-white/96 backdrop-blur-xl border-b border-slate-200/60 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

          {/* ── Logo ── */}
          <motion.button
            onClick={() => navigate("beranda")}
            className="flex items-center gap-2.5 flex-shrink-0"
            whileTap={{ scale: 0.97 }}
          >
            <img
              src="/images/HDB-LOGO.png"
              alt="CV.HDB Airconds"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div>
              <div className={`text-xl font-bold leading-none tracking-tight transition-colors duration-300 ${
                isTransparent ? "text-white" : "text-slate-800"
              }`}>
                HDB<span className="text-sky-400">Airconds</span>
              </div>
              <div className={`text-[10px] font-medium tracking-widest uppercase transition-colors duration-300 ${
                isTransparent ? "text-sky-200" : "text-sky-500"
              }`}>
                Cooling Solutions
              </div>
            </div>
          </motion.button>

          {/* ── Desktop Nav ── */}
          <div
            className="hidden lg:flex items-center gap-0.5"
            onMouseLeave={() => setHoveredNav(null)}
          >
            {mainNavItems.map(item => {
              const active  = currentPage === item.id;
              const hovered = hoveredNav === item.id;
              const showPill = hovered || (active && !hoveredNav);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  onMouseEnter={() => setHoveredNav(item.id)}
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    active
                      ? isTransparent ? "text-white" : "text-sky-600"
                      : isTransparent ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-sky-600"
                  }`}
                >
                  {showPill && (
                    <motion.span
                      layoutId="nav-pill"
                      className={`absolute inset-0 rounded-lg ${isTransparent ? "bg-white/15" : "bg-sky-50"}`}
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full ${
                        isTransparent ? "bg-white" : "bg-sky-500"
                      }`}
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}

            {/* ── Informasi Dropdown ── */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setHoveredNav("informasi")}
            >
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className={`relative flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isInfoActive
                    ? isTransparent ? "text-white" : "text-sky-600"
                    : isTransparent ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-sky-600"
                }`}
              >
                {(hoveredNav === "informasi" || (isInfoActive && !hoveredNav)) && (
                  <motion.span
                    layoutId="nav-pill"
                    className={`absolute inset-0 rounded-lg ${isTransparent ? "bg-white/15" : "bg-sky-50"}`}
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">Informasi</span>
                <motion.span
                  animate={{ rotate: dropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.span>
                {isInfoActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full ${
                      isTransparent ? "bg-white" : "bg-sky-500"
                    }`}
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-64 bg-white rounded-2xl shadow-2xl shadow-sky-200/60 border border-slate-100/80 overflow-hidden z-50"
                  >
                    <div className="h-[3px] bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
                    <div className="py-2">
                      {infoItems.map((item, i) => {
                        const active = currentPage === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 + 0.04 }}
                            onClick={() => navigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm group transition-colors ${
                              active ? "bg-sky-50" : "hover:bg-sky-50/70"
                            }`}
                          >
                            <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                              active
                                ? "bg-sky-100 text-sky-600"
                                : "bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600"
                            }`}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div className="text-left min-w-0">
                              <div className={`font-semibold leading-tight transition-colors ${
                                active ? "text-sky-600" : "text-slate-700 group-hover:text-sky-600"
                              }`}>{item.label}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{item.desc}</div>
                            </div>
                            <ArrowRight className={`w-3.5 h-3.5 ml-auto flex-shrink-0 transition-all ${
                              active
                                ? "text-sky-400"
                                : "text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                            }`} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right Actions (Desktop) ── */}
          <div className="hidden lg:flex items-center gap-1">
            {authToken && userRole === "user" && (
              <>
                <button
                  onClick={() => navigate("pesanan-saya")}
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                    currentPage === "pesanan-saya"
                      ? isTransparent ? "text-white bg-white/20" : "text-sky-600 bg-sky-50"
                      : isTransparent
                        ? "text-white/80 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-sky-600 hover:bg-sky-50"
                  }`}
                >
                  Pesanan Saya
                </button>
                <button
                  onClick={() => navigate("profil")}
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                    currentPage === "profil"
                      ? isTransparent ? "text-white bg-white/20" : "text-sky-600 bg-sky-50"
                      : isTransparent
                        ? "text-white/80 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-sky-600 hover:bg-sky-50"
                  }`}
                >
                  Profil
                </button>
              </>
            )}

            <CartBadge />

            {authToken ? (
              <motion.button
                onClick={onLogout}
                whileTap={{ scale: 0.96 }}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                  isTransparent
                    ? "text-white hover:bg-white/10"
                    : "text-slate-600 hover:text-red-500 hover:bg-red-50"
                }`}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={onOpenLogin}
                  whileTap={{ scale: 0.96 }}
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                    isTransparent
                      ? "text-white hover:bg-white/10"
                      : "text-slate-600 hover:text-sky-600 hover:bg-sky-50"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Login
                </motion.button>
                <motion.button
                  onClick={() => navigate("kontak")}
                  whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(14,165,233,0.4)" }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-sky-500/25 transition-colors duration-200 ml-1"
                >
                  <Phone className="w-4 h-4" />
                  Hubungi
                </motion.button>
              </>
            )}
          </div>

          {/* ── Mobile Right ── */}
          <div className="lg:hidden flex items-center gap-0.5">
            <CartBadge mobile />
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-all ${
                isTransparent ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-sky-50"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isMobileMenuOpen ? "close" : "open"}
                  initial={{ rotate: isMobileMenuOpen ? -90 : 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: isMobileMenuOpen ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ top: navHeight }}
              className="fixed left-0 right-0 z-40 bg-white/98 backdrop-blur-xl shadow-2xl border-b border-slate-100 lg:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 space-y-0.5">

                {/* Main nav items */}
                {mainNavItems.map((item, i) => {
                  const active = currentPage === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.055, duration: 0.25 }}
                      onClick={() => navigate(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? "bg-sky-50 text-sky-600"
                          : "text-slate-700 hover:bg-sky-50/60 hover:text-sky-600"
                      }`}
                    >
                      {item.label}
                      {active && (
                        <motion.span
                          layoutId="mobile-dot"
                          className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0"
                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}

                {/* Informasi section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.22 }}
                  className="pt-2"
                >
                  <p className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Informasi
                  </p>
                  {infoItems.map((item, i) => {
                    const active = currentPage === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.22 + i * 0.055 }}
                        onClick={() => navigate(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          active
                            ? "bg-sky-50 text-sky-600"
                            : "text-slate-700 hover:bg-sky-50/60 hover:text-sky-600"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                          active ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-400"
                        }`}>
                          <item.icon className="w-3.5 h-3.5" />
                        </div>
                        {item.label}
                        {active && (
                          <motion.span
                            layoutId="mobile-dot"
                            className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0 ml-auto"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>

                {/* Pesanan Saya & Profil */}
                {authToken && userRole === "user" && (
                  <>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.38 }}
                      onClick={() => navigate("pesanan-saya")}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        currentPage === "pesanan-saya"
                          ? "bg-sky-50 text-sky-600"
                          : "text-slate-700 hover:bg-sky-50 hover:text-sky-600"
                      }`}
                    >
                      Pesanan Saya
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      onClick={() => navigate("profil")}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                        currentPage === "profil"
                          ? "bg-sky-50 text-sky-600"
                          : "text-slate-700 hover:bg-sky-50 hover:text-sky-600"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Profil
                    </motion.button>
                  </>
                )}

                {/* Auth */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="border-t border-slate-100 pt-3 mt-2 space-y-1.5"
                >
                  {authToken ? (
                    <button
                      onClick={() => { onLogout?.(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => { onOpenLogin?.(); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Login / Daftar
                      </button>
                      <button
                        onClick={() => navigate("kontak")}
                        className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Hubungi Kami
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
