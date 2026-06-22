import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Phone,
  MapPin,
  Lock,
  Snowflake,
  Droplets,
  Wrench,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { CartItem } from "../data";

interface CheckoutProps {
  cart: CartItem[];
  onBack: () => void;
  onSuccess?: () => void;
  onClearCart: () => void;
  authToken?: string | null;
}

const getServiceIcon = (iconName?: string) => {
  switch (iconName) {
    case "snowflake": return <Snowflake className="w-6 h-6 text-sky-500" />;
    case "droplets": return <Droplets className="w-6 h-6 text-sky-500" />;
    case "wrench": return <Wrench className="w-6 h-6 text-sky-500" />;
    case "shopping-bag": return <ShoppingBag className="w-6 h-6 text-sky-500" />;
    default: return <Wrench className="w-6 h-6 text-sky-500" />;
  }
};

// Declare Snap global variable
declare global {
  interface Window {
    snap: any;
  }
}

export default function Checkout({
  cart,
  onBack,
  onSuccess,
  onClearCart,
  authToken,
}: CheckoutProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    notes: "",
  });

  const hasService = cart.some((item) => item.itemType === "service");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "pending" | "error"
  >("idle");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [orderedCount, setOrderedCount] = useState(0);
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);
  const isSubmittingRef = React.useRef(false);

  // Pre-fill data diri dari profil user agar tidak perlu mengetik ulang.
  // Per-pesanan: perubahan di form ini TIDAK menimpa profil tersimpan
  // (profil hanya diubah lewat halaman Profil).
  useEffect(() => {
    if (!authToken) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (!active || !res.ok || !data.success) return;
        const p = data.data || {};
        if (p.name || p.phone || p.address) {
          setFormData((prev) => ({
            ...prev,
            customerName: prev.customerName || p.name || "",
            phone: prev.phone || p.phone || "",
            address: prev.address || p.address || "",
          }));
          setPrefilledFromProfile(true);
        }
      } catch {
        // diam saja — user tetap bisa mengisi manual
      }
    })();
    return () => {
      active = false;
    };
  }, [authToken]);

  // Load Midtrans Snap script
  useEffect(() => {
    const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === "true";
    const scriptUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "";

    // Check if script sudah loaded
    if (window.snap && typeof window.snap.pay === "function") {
      console.log("✅ Midtrans Snap already available");
      return;
    }

    // Check if script tag sudah ada di DOM
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existingScript) {
      console.log("✅ Snap script tag already exists, waiting for load...");
      // Wait for window.snap to be available
      const checkSnap = setInterval(() => {
        if (window.snap && typeof window.snap.pay === "function") {
          console.log("✅ Midtrans Snap loaded from existing script");
          clearInterval(checkSnap);
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;

    script.onload = () => {
      console.log("✅ Midtrans Snap script loaded");
      // Verify snap is available
      if (window.snap && typeof window.snap.pay === "function") {
        console.log("✅ Snap.pay is available");
      } else {
        console.warn("⚠️ Snap loaded but snap.pay not available yet");
      }
    };

    script.onerror = () => {
      console.error("❌ Failed to load Midtrans Snap from:", scriptUrl);
      setStatus("error");
      setErrorMessage(
        "Gagal memuat Midtrans Snap. Periksa koneksi internet atau konfigurasi.",
      );
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script - let it stay for reuse
    };
  }, []);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Defensive: ensure price is Number (MySQL DECIMAL may come as string)
  const items = cart.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price) || 0,
    quantity: item.quantity,
    itemType: item.itemType,
  }));
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const productNames = cart.map((i) => i.name).join(", ");
  const productIds = cart.map((i) => i.id).join(",");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmittingRef.current) {
      console.warn("⚠️ Already submitting, skipping duplicate request");
      return;
    }

    isSubmittingRef.current = true;
    setStatus("loading");
    setLoadingMessage("Mempersiapkan pembayaran...");
    setErrorMessage("");

    try {
      if (!authToken) {
        setStatus("error");
        setErrorMessage("Anda harus login untuk melakukan pemesanan");
        isSubmittingRef.current = false;
        return;
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      };

      // Step 1: Generate Snap Token
      setLoadingMessage("Membuat token pembayaran (1/2)...");

      const snapTokenResponse = await fetch("/api/midtrans/snap-token", {
        method: "POST",
        headers,
        body: JSON.stringify({
          productId: productIds,
          productName: productNames,
          price: totalPrice,
          quantity: totalQuantity,
          items: items,
          customerName: formData.customerName,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes || null,
        }),
      });

      const snapTokenData = await snapTokenResponse.json();

      if (!snapTokenResponse.ok || !snapTokenData.success) {
        setStatus("error");
        setErrorMessage(
          snapTokenData.error || "Gagal membuat token pembayaran",
        );
        isSubmittingRef.current = false;
        return;
      }

      const snapToken = snapTokenData.snapToken;
      const orderId = snapTokenData.orderId;
      const syncPaymentStatus = async (transactionStatus: string, transactionId?: string) => {
        await fetch("/api/midtrans/payment-callback", {
          method: "POST",
          headers,
          body: JSON.stringify({
            orderId,
            transactionStatus,
            transactionId,
          }),
        });
      };

      console.log("💳 Snap Token received:", snapToken);

      // Step 2: Show Midtrans Snap payment UI
      setLoadingMessage("Membuka metode pembayaran (2/2)...");

      if (!window.snap) {
        throw new Error("Midtrans Snap not loaded");
      }

      // Ensure Snap is ready
      if (typeof window.snap.pay !== "function") {
        throw new Error("Snap.pay is not available");
      }

      // Log timing
      const snapStartTime = Date.now();
      console.log("🔔 snap.pay() called at:", new Date().toLocaleTimeString());

      // Set timeout untuk Snap (20 detik - lebih lama untuk network yang lambat)
      const snapTimeout = setTimeout(() => {
        console.warn("⚠️ Snap payment timeout after 20 seconds");
        setStatus("error");
        setErrorMessage(
          "Metode pembayaran lambat dimuat. Pastikan koneksi internet stabil. Silakan coba lagi.",
        );
        isSubmittingRef.current = false;
      }, 20000); // 20 detik timeout

      window.snap.pay(snapToken, {
        onSuccess: async function (result: any) {
          const duration = Date.now() - snapStartTime;
          clearTimeout(snapTimeout);
          console.log("✅ Payment success after", duration, "ms:", result);

          try {
            await syncPaymentStatus(result.transaction_status, result.transaction_id);
            console.log("📱 Payment status synced to server");
          } catch (syncErr) {
            console.warn("⚠️ Failed to sync payment status:", syncErr);
          }

          setOrderedCount(totalQuantity);
          setStatus("success");
          onClearCart();
          isSubmittingRef.current = false;
        },
        onPending: async function (result: any) {
          const duration = Date.now() - snapStartTime;
          clearTimeout(snapTimeout);
          console.log("⏳ Payment pending after", duration, "ms:", result);

          try {
            await syncPaymentStatus(result.transaction_status, result.transaction_id);
          } catch (syncErr) {
            console.warn("⚠️ Failed to sync pending status:", syncErr);
          }

          setOrderedCount(totalQuantity);
          setStatus("pending");
          onClearCart();
          isSubmittingRef.current = false;
        },
        onError: async function (result: any) {
          const duration = Date.now() - snapStartTime;
          clearTimeout(snapTimeout);
          console.log("❌ Payment error after", duration, "ms:", result);
          try {
            await syncPaymentStatus(result?.transaction_status || "cancel", result?.transaction_id);
          } catch (syncErr) {
            console.warn("Failed to sync failed payment:", syncErr);
          }

          setStatus("error");
          setErrorMessage(
            `Pembayaran gagal: ${result.status_message || "Silakan coba lagi"}.`,
          );
          isSubmittingRef.current = false;
        },
        onClose: async function () {
          const duration = Date.now() - snapStartTime;
          clearTimeout(snapTimeout);
          console.log("❌ Payment popup closed after", duration, "ms");
          try {
            await syncPaymentStatus("cancel");
          } catch (syncErr) {
            console.warn("Failed to cancel unpaid order:", syncErr);
          }

          setStatus("error");
          setErrorMessage("Pembayaran dibatalkan. Item masih ada di keranjang dan bisa dicoba lagi.");
          isSubmittingRef.current = false;
        },
      });
    } catch (error: any) {
      console.error("Error:", error);
      setStatus("error");
      setErrorMessage(
        error.message || "Terjadi kesalahan saat memproses pembayaran",
      );
      isSubmittingRef.current = false;
    }
  };

  if (status === "success" || status === "pending") {
    const isPendingPayment = status === "pending";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-md w-full">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-white p-8 rounded-2xl shadow-xl border border-sky-100 text-center mb-6"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              {isPendingPayment ? "Menunggu Pembayaran" : "Pesanan Berhasil!"}
            </h2>
            <p className="text-slate-600 mb-2 text-lg">
              Terima kasih,{" "}
              <span className="font-bold text-sky-600">
                {formData.customerName}
              </span>
            </p>
            <p className="text-slate-500 mb-6">
              {isPendingPayment ? (
                <>
                  Instruksi pembayaran untuk{" "}
                  <span className="font-bold">{orderedCount} item</span> sudah
                  dibuat. Silakan lanjutkan dari halaman pesanan jika belum
                  selesai.
                </>
              ) : (
                <>
                  Pesanan Anda untuk{" "}
                  <span className="font-bold">{orderedCount} barang</span> telah
                  kami terima dan sedang diproses.
                </>
              )}
            </p>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-8">
              <p className="text-sm text-sky-900 mb-2">
                <span className="font-bold">Status Pesanan:</span>{" "}
                {isPendingPayment ? "Menunggu Pembayaran" : "Menunggu Konfirmasi"}
              </p>
              <p className="text-xs text-sky-700">
                Anda akan menerima update melalui WhatsApp di{" "}
                <span className="font-bold">{formData.phone}</span>
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSuccess ? onSuccess() : onBack()}
              className="w-full bg-sky-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/30 mb-3"
            >
              Lihat Pesanan Saya
            </motion.button>

            <p className="text-xs text-slate-500">
              Nomor referensi pesanan telah dikirim ke WhatsApp Anda
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 text-center"
          >
            <p className="text-sm text-slate-600 mb-2">
              Pertanyaan? Hubungi kami
            </p>
            <a
              href="https://wa.me/6281515729739?text=Halo%20saya%20punya%20pertanyaan%20tentang%20pesanan%20saya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 font-bold hover:text-sky-700 text-sm"
            >
              Chat WhatsApp Kami →
            </a>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-slate-50 min-h-screen py-12"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button
          whileHover={{ x: -5 }}
          whileTap={{ x: 0 }}
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-sky-600 mb-8 transition-colors font-medium"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Kembali
        </motion.button>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {[
              { step: 1, label: "Keranjang", icon: "🛒" },
              { step: 2, label: "Data Diri", icon: "📝" },
              { step: 3, label: "Pembayaran", icon: "💳" },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center flex-1"
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg border-2 transition-all ${
                    idx < 2
                      ? "bg-sky-500 border-sky-500 text-white"
                      : idx === 1
                        ? "bg-sky-100 border-sky-500 text-sky-600"
                        : "bg-slate-100 border-slate-300 text-slate-600"
                  }`}
                >
                  {item.icon}
                </div>
                <p
                  className={`ml-2 sm:ml-3 font-semibold text-xs sm:text-sm hidden xs:block ${idx < 2 ? "text-sky-600" : idx === 1 ? "text-slate-900" : "text-slate-500"}`}
                >
                  {item.label}
                </p>
                {idx < 2 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: idx * 0.2 + 0.3 }}
                    className="flex-1 h-1 bg-sky-500 ml-3 origin-left"
                  ></motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Selesaikan Checkout
            </h1>
            <p className="text-slate-600">
              Lengkapi data diri Anda untuk memproses pesanan
            </p>
          </div>

          <div className="p-6 md:p-8">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 p-6 bg-gradient-to-br from-sky-50 to-slate-50 rounded-2xl border border-sky-100"
            >
              <h3 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
                <span className="text-2xl">📦</span> Ringkasan Pesanan (
                {totalQuantity} Item)
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {cart.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-slate-100"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                      {item.itemType === "product" && item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        getServiceIcon(item.icon)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 line-clamp-1 text-sm">
                        {item.name}
                      </h4>
                      {item.itemType === "product" ? (
                        <p className="text-xs text-slate-500 mb-1">
                          {item.brand} • {item.capacity}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mb-1">Layanan</p>
                      )}
                      <p className="font-bold text-sky-600 text-sm">
                        {formatRupiah(item.price * item.quantity)}
                        {item.quantity > 1 && (
                          <span className="text-xs font-normal text-slate-400 ml-1">
                            × {item.quantity}
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">
                      Terjadi Kesalahan
                    </p>
                    <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                    <p className="text-xs text-red-600 mt-2">
                      💡 Tip: Pastikan koneksi internet stabil dan pop-up
                      browser tidak diblokir
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setErrorMessage("");
                    isSubmittingRef.current = false;
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 w-full px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  🔄 Coba Lagi
                </motion.button>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info: data terisi dari profil */}
              {prefilledFromProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2"
                >
                  <User className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-sky-800">
                    Data diri terisi otomatis dari profil Anda. Boleh diubah
                    untuk pesanan ini tanpa memengaruhi profil tersimpan.
                  </p>
                </motion.div>
              )}

              {/* Name Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-500" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all placeholder-slate-400"
                  placeholder="Masukkan nama lengkap Anda"
                />
              </motion.div>

              {/* Phone Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-sky-500" />
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all placeholder-slate-400"
                  placeholder="0812xxxx"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Gunakan nomor yang aktif untuk komunikasi pesanan
                </p>
              </motion.div>

              {/* Address Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-500" />
                  Alamat Pengiriman & Pemasangan
                </label>
                <textarea
                  name="address"
                  required
                  rows={4}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all resize-none placeholder-slate-400"
                  placeholder="Tuliskan alamat lengkap termasuk kota dan kodepos..."
                ></textarea>
              </motion.div>

              {/* Keluhan Kerusakan - hanya tampil jika ada layanan */}
              {hasService && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="p-5 bg-amber-50 border-2 border-amber-200 rounded-xl"
                >
                  <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    Keluhan Kerusakan
                    <span className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Wajib untuk pesanan layanan
                    </span>
                  </label>
                  <textarea
                    name="notes"
                    required={hasService}
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full bg-white border-2 border-amber-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all resize-none placeholder-slate-400"
                    placeholder="Contoh: AC tidak dingin, AC bocor, AC berbunyi berisik, suhu tidak turun, dll."
                  ></textarea>
                  <p className="text-xs text-amber-700 mt-2">
                    Jelaskan kerusakan secara detail agar teknisi dapat mempersiapkan alat dan spare part yang diperlukan.
                  </p>
                </motion.div>
              )}

              {/* Total & Payment Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="pt-6 border-t-2 border-slate-200"
              >
                <div className="flex justify-between items-center mb-6 p-4 bg-sky-50 rounded-xl border border-sky-100">
                  <span className="text-slate-700 font-bold text-lg">
                    Total Pembayaran
                  </span>
                  <span className="text-3xl font-bold text-sky-600">
                    {formatRupiah(totalPrice)}
                  </span>
                </div>

                <motion.button
                  type="submit"
                  disabled={status === "loading"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-sky-500 text-white font-bold py-4 px-4 rounded-xl hover:bg-sky-600 transition-all flex justify-center items-center gap-2 shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <div className="text-left">
                        <div className="font-semibold">{loadingMessage}</div>
                        <div className="text-xs opacity-70 mt-0.5">
                          ⏱️ Mohon tunggu (max 20 detik)
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" /> Lanjut ke Pembayaran
                    </>
                  )}
                </motion.button>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-2"
                >
                  🔒 Pembayaran aman melalui Midtrans (QRIS, Transfer Bank,
                  GoPay)
                </motion.p>
              </motion.div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
