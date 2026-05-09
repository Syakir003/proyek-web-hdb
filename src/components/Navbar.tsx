import React, { useState, useEffect } from "react";
import { ShoppingCart, User, Menu, X, Wind, LogOut, Phone } from "lucide-react";
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

export default function Navbar({
  currentPage,
  setCurrentPage,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  authToken,
  userRole,
  onLogout,
  onOpenLogin,
  cartCount = 0,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = currentPage === "beranda";
  const isTransparent = isHome && !scrolled;

  const navBg = isTransparent
    ? "bg-transparent"
    : "bg-white/95 backdrop-blur-md shadow-lg shadow-sky-100/50";
  const linkColor = isTransparent
    ? "text-white/90 hover:text-white"
    : "text-slate-700 hover:text-sky-500";
  const logoTextColor = isTransparent ? "text-white" : "text-slate-800";
  const logoSubColor = isTransparent ? "text-sky-200" : "text-sky-500";
  const logoBgColor = isTransparent ? "bg-white/20 backdrop-blur-sm" : "bg-sky-500";

  const navItems = [
    { id: "beranda", label: "Beranda" },
    { id: "katalog", label: "Produk" },
    { id: "tentang", label: "Tentang Kami" },
    { id: "kontak", label: "Kontak" },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.button
              onClick={() => setCurrentPage("beranda")}
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`p-2 rounded-xl ${logoBgColor} transition-all duration-300`}>
                <Wind className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className={`text-xl font-bold leading-none tracking-tight transition-colors duration-300 ${logoTextColor}`}>
                  HDB<span className="text-sky-400">Airconds</span>
                </div>
                <div className={`text-[10px] font-medium tracking-widest uppercase transition-colors duration-300 ${logoSubColor}`}>
                  Cooling Solutions
                </div>
              </div>
            </motion.button>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? isTransparent
                          ? "text-white bg-white/20"
                          : "text-sky-600 bg-sky-50"
                        : linkColor
                    }`}
                  >
                    {item.label}
                    {active && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full ${isTransparent ? "bg-white" : "bg-sky-500"}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="hidden lg:flex items-center gap-3">
              {authToken && userRole === "user" && (
                <button
                  onClick={() => setCurrentPage("pesanan-saya")}
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${linkColor}`}
                >
                  Pesanan Saya
                </button>
              )}

              {/* Cart */}
              <button
                onClick={() => setCurrentPage("cart")}
                className={`relative p-2 rounded-lg transition-all ${isTransparent ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-sky-50 hover:text-sky-500"}`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </motion.span>
                )}
              </button>

              {authToken ? (
                <button
                  onClick={onLogout}
                  className={`flex items-center gap-2 text-sm font-medium transition-all px-4 py-2 rounded-lg ${isTransparent ? "text-white hover:bg-white/10" : "text-slate-600 hover:text-red-600 hover:bg-red-50"}`}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <>
                  <button
                    onClick={onOpenLogin}
                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${isTransparent ? "text-white hover:bg-white/10" : "text-slate-600 hover:text-sky-600"}`}
                  >
                    <User className="w-4 h-4 inline mr-1" />
                    Login
                  </button>
                  <motion.button
                    onClick={() => setCurrentPage("kontak")}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-sky-500/30 transition-all duration-200"
                  >
                    <Phone className="w-4 h-4" />
                    Hubungi Kami
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile Right */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={() => setCurrentPage("cart")}
                className={`relative p-2 rounded-lg transition-all ${isTransparent ? "text-white" : "text-slate-600"}`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg transition-all ${isTransparent ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-sky-50"}`}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-0 right-0 z-40 bg-white shadow-2xl border-t border-sky-100 lg:hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setCurrentPage(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active ? "bg-sky-50 text-sky-600" : "text-slate-700 hover:bg-sky-50 hover:text-sky-600"}`}
                  >
                    {item.label}
                  </button>
                );
              })}
              {authToken && userRole === "user" && (
                <button onClick={() => { setCurrentPage("pesanan-saya"); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors">
                  Pesanan Saya
                </button>
              )}
              <div className="pt-2 pb-1 space-y-2">
                {authToken ? (
                  <button onClick={() => { onLogout?.(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 font-medium rounded-xl text-red-600 hover:bg-red-50 transition-all text-sm">
                    Logout
                  </button>
                ) : (
                  <>
                    <button onClick={() => { onOpenLogin?.(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 font-medium rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-all text-sm">
                      Login / Daftar
                    </button>
                    <button onClick={() => { setCurrentPage("kontak"); setIsMobileMenuOpen(false); }} className="w-full bg-sky-500 hover:bg-sky-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" /> Hubungi Kami
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
