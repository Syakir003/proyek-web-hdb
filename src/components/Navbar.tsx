import React from "react";
import { ShoppingCart, User, Menu, X, Wind, LogOut } from "lucide-react";
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
  const navItems = [
    { id: "beranda", label: "Beranda" },
    { id: "katalog", label: "Katalog" },
    { id: "tentang", label: "Tentang Kami" },
    { id: "kontak", label: "Kontak" },
  ];

  return (
    <motion.nav className="bg-white shadow-md sticky top-0 z-40 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center cursor-pointer group"
            onClick={() => setCurrentPage("beranda")}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg mr-2 group-hover:shadow-lg transition-all"
            >
              <Wind className="w-6 h-6 text-blue-600" />
            </motion.div>
            <div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                HDB <span className="text-blue-600">Airconds</span>
              </span>
              <p className="text-xs text-slate-500">Solusi Pendingin Udara</p>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                onClick={() => setCurrentPage(item.id)}
                className={`font-medium transition-all text-sm relative px-3 py-2 rounded-lg ${
                  currentPage === item.id
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                }`}
              >
                {item.label}
                {currentPage === item.id && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full"
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Right Icons */}
          <div className="hidden md:flex items-center space-x-4">
            {authToken && userRole === "user" && (
              <motion.button
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgb(219, 234, 254)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage("pesanan-saya")}
                className="text-slate-600 hover:text-blue-600 font-medium transition-all text-sm px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                📦 Pesanan Saya
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentPage("cart")}
              className="text-slate-600 hover:text-blue-600 relative p-2 hover:bg-blue-50 rounded-lg transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </motion.span>
              )}
            </motion.button>
            {authToken ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="text-slate-600 hover:text-red-600 flex items-center gap-2 text-sm font-medium transition-all px-4 py-2 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenLogin}
                className="text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 text-sm font-bold transition-all px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            {authToken && userRole === "user" && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage("pesanan-saya")}
                className="text-slate-600 text-sm font-bold px-2 py-1 hover:text-blue-600"
              >
                📦
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage("cart")}
              className="text-slate-600 relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </motion.span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-gradient-to-b from-white to-slate-50 border-t border-slate-200 overflow-hidden shadow-lg"
          >
            <div className="px-4 pt-3 pb-4 space-y-1">
              {navItems.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 font-medium rounded-lg transition-all ${
                    currentPage === item.id
                      ? "bg-blue-100 text-blue-600 font-bold"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border-t border-slate-200 pt-3 mt-3"
              >
                {authToken ? (
                  <button
                    onClick={() => {
                      onLogout?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 font-medium rounded-lg text-red-600 hover:bg-red-50 transition-all"
                  >
                    🚪 Logout
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onOpenLogin?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 font-bold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  >
                    👤 Login / Daftar
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
