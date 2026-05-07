import React from "react";
import {
  Trash2,
  ShoppingCart,
  ArrowRight,
  AlertCircle,
  Plus,
  Minus,
  Check,
  Heart,
} from "lucide-react";
import { Product } from "../data";
import { motion, AnimatePresence } from "motion/react";
import Catalog from "./Catalog";

interface CartProps {
  cart: Product[];
  onRemove: (index: number) => void;
  onCheckout: () => void;
  onLogin: () => void;
  authToken?: string | null;
}

export default function Cart({
  cart,
  onRemove,
  onCheckout,
  onLogin,
  authToken,
}: CartProps) {
  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckoutAll = () => {
    if (cart.length === 0) return;
    onCheckout();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                Keranjang Belanja
              </h1>
              <p className="text-slate-500 mt-1">
                Verifikasi pesanan Anda sebelum checkout
              </p>
            </div>
          </div>
        </motion.div>

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ShoppingCart className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Keranjang Anda Kosong
            </h2>
            <p className="text-slate-600 mb-8 text-lg">
              Silakan jelajahi katalog kami untuk menemukan unit AC sempurna
              untuk Anda.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              Lihat Katalog <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center mb-4 px-2"
              >
                <h2 className="text-lg font-bold text-slate-900">
                  Item Pesanan ({cart.length})
                </h2>
                <span className="text-sm text-slate-500">
                  Geser ke kiri untuk menghapus
                </span>
              </motion.div>

              <AnimatePresence mode="popLayout">
                {cart.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-300 group"
                  >
                    <motion.img
                      src={item.image}
                      alt={item.name}
                      className="w-28 h-28 object-cover rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {item.brand}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {item.capacity}
                        </span>
                      </div>
                      <p className="font-bold text-blue-600 text-lg">
                        {formatRupiah(item.price)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Tambah ke favorit"
                      >
                        <Heart className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onRemove(index)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-sm border border-blue-200 p-6 sticky top-24 hover:shadow-lg transition-shadow duration-300"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" /> Ringkasan Pesanan
                </h3>

                <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal ({cart.length} item)</span>
                    <span className="font-semibold">
                      {formatRupiah(totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Diskon</span>
                    <span className="font-semibold text-green-600">
                      -{formatRupiah(totalPrice * 0.05)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Ongkir</span>
                    <span className="font-semibold">Gratis ongkir</span>
                  </div>
                </div>

                <div className="flex justify-between text-slate-900 font-bold text-lg mb-6 pb-6 border-b border-slate-200">
                  <span>Total</span>
                  <span className="text-2xl text-blue-600">
                    {formatRupiah(totalPrice * 0.95)}
                  </span>
                </div>

                {!authToken ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-900 font-semibold mb-3">
                          Login untuk melanjutkan checkout
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={onLogin}
                          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-2.5 rounded-lg text-sm font-bold hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg"
                        >
                          Login / Daftar Sekarang
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckoutAll}
                    disabled={cart.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-5 h-5" /> Lanjut ke Checkout
                  </motion.button>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center"
                >
                  <p className="text-xs text-green-700 font-semibold">
                    ✓ Pembayaran aman dengan Midtrans
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
