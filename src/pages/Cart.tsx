import React from "react";
import {
  Trash2,
  ShoppingCart,
  ArrowRight,
  AlertCircle,
  Check,
  Minus,
  Plus,
  Snowflake,
  Droplets,
  Wrench,
  ShoppingBag,
} from "lucide-react";
import { CartItem } from "../data";
import { motion, AnimatePresence } from "motion/react";

interface CartProps {
  cart: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onCheckout: () => void;
  onLogin: () => void;
  authToken?: string | null;
  onBrowse?: () => void;
}

const getServiceIcon = (iconName?: string) => {
  switch (iconName) {
    case "snowflake": return <Snowflake className="w-8 h-8 text-sky-500" />;
    case "droplets": return <Droplets className="w-8 h-8 text-sky-500" />;
    case "wrench": return <Wrench className="w-8 h-8 text-sky-500" />;
    case "shopping-bag": return <ShoppingBag className="w-8 h-8 text-sky-500" />;
    default: return <Wrench className="w-8 h-8 text-sky-500" />;
  }
};

export default function Cart({
  cart,
  onRemove,
  onUpdateQuantity,
  onCheckout,
  onLogin,
  authToken,
  onBrowse,
}: CartProps) {
  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

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
            <div className="p-3 bg-sky-100 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-sky-600" />
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
              Silakan jelajahi katalog kami untuk menemukan unit AC atau layanan
              yang Anda butuhkan.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBrowse}
              className="bg-sky-500 text-white px-8 py-3 rounded-full font-bold hover:bg-sky-600 transition-colors inline-flex items-center gap-2 shadow-lg shadow-sky-500/30"
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
                  Item Pesanan ({totalQuantity})
                </h2>
              </motion.div>

              <AnimatePresence mode="popLayout">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-4 hover:shadow-lg hover:border-sky-100 transition-all duration-300 group"
                  >
                    {/* Thumbnail */}
                    {item.itemType === "product" && item.image ? (
                      <motion.img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 group-hover:scale-105 transition-transform duration-300 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 border border-sky-100">
                        {getServiceIcon(item.icon)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1 group-hover:text-sky-600 transition-colors">
                            {item.name}
                          </h3>
                          {item.itemType === "product" ? (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {item.brand && (
                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  {item.brand}
                                </span>
                              )}
                              {item.capacity && (
                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  {item.capacity}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded mb-2 inline-block">
                              Layanan
                            </span>
                          )}
                          <p className="font-bold text-sky-600 text-sm">
                            {formatRupiah(item.price * item.quantity)}
                            {item.quantity > 1 && (
                              <span className="text-xs font-normal text-slate-400 ml-1">
                                ({formatRupiah(item.price)} × {item.quantity})
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Delete button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onRemove(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 flex-shrink-0"
                          title="Hapus dari keranjang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </motion.button>
                        <span className="w-8 text-center font-bold text-slate-900 text-sm">
                          {item.quantity}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-600 flex items-center justify-center transition-all text-slate-600"
                        >
                          <Plus className="w-3 h-3" />
                        </motion.button>
                      </div>
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
                className="bg-gradient-to-br from-sky-50 to-white rounded-2xl shadow-sm border border-sky-100 p-6 sticky top-24 hover:shadow-lg transition-shadow duration-300"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" /> Ringkasan Pesanan
                </h3>

                <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal ({totalQuantity} item)</span>
                    <span className="font-semibold">
                      {formatRupiah(totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Ongkir</span>
                    <span className="font-semibold">Gratis ongkir</span>
                  </div>
                </div>

                <div className="flex justify-between text-slate-900 font-bold text-lg mb-6 pb-6 border-b border-slate-200">
                  <span>Total</span>
                  <span className="text-2xl text-sky-600">
                    {formatRupiah(totalPrice)}
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
                    onClick={onCheckout}
                    disabled={cart.length === 0}
                    className="w-full bg-sky-500 text-white py-3 rounded-xl font-bold hover:bg-sky-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
