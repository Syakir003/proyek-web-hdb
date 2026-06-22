/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { BrandIcon } from "./components/BrandIcons";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import UserOrders from "./pages/UserOrders";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import TeknisiDashboard from "./pages/teknisi/TeknisiDashboard";
import Layanan from "./pages/Layanan";
import Karir from "./pages/Karir";
import Blog from "./pages/Blog";
import Privasi from "./pages/Privasi";
import Syarat from "./pages/Syarat";
import CustomerAdditionApproval from "./pages/CustomerAdditionApproval";
import InvoiceView from "./pages/InvoiceView";
import { Product, CartItem, Service } from "./data";
import { useSEO } from "./hooks/useSEO";

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/tambahan/')) return 'tambahan';
    if (path.startsWith('/invoice/')) return 'invoice';
    if (path.startsWith('/order-invoice/')) return 'order-invoice';
    const savedToken = localStorage.getItem("authToken");
    const savedRole = localStorage.getItem("userRole");
    if (savedToken) {
      if (savedRole === "admin") return "admin";
      if (savedRole === "teknisi") return "teknisi";
    }
    return "beranda";
  });
  const [previousPage, setPreviousPage] = useState("beranda");
  const [additionToken, setAdditionToken] = useState<string | null>(() => {
    const path = window.location.pathname;
    return path.startsWith('/tambahan/') ? path.replace('/tambahan/', '') : null;
  });
  const [invoiceToken, setInvoiceToken] = useState<string | null>(() => {
    const path = window.location.pathname;
    return path.startsWith('/invoice/') ? path.replace('/invoice/', '') : null;
  });
  const [orderInvoiceToken, setOrderInvoiceToken] = useState<string | null>(() => {
    const path = window.location.pathname;
    return path.startsWith('/order-invoice/') ? path.replace('/order-invoice/', '') : null;
  });

  // SEO: update title & meta tags setiap ganti halaman
  useSEO(currentPage);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] =
    useState<Product | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem("authToken"),
  );
  const [userRole, setUserRole] = useState<"admin" | "user" | "teknisi" | null>(
    localStorage.getItem("userRole") as "admin" | "user" | "teknisi" | null,
  );
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedRole = localStorage.getItem("userRole");
    if (!savedToken || savedRole !== "user") return [];

    const savedCart = localStorage.getItem("cart");
    if (!savedCart) return [];

    try {
      return JSON.parse(savedCart);
    } catch {
      localStorage.removeItem("cart");
      return [];
    }
  });
  const canUseCart = Boolean(authToken && userRole === "user");
  const visibleCart = canUseCart ? cart : [];

  useEffect(() => {
    if (!canUseCart) {
      localStorage.removeItem("cart");
      if (cart.length > 0) setCart([]);
      return;
    }

    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart, canUseCart]);

  // ── SEO: URL routing via History API ──────────────────────────────────────
  const PATH_TO_PAGE: Record<string, string> = {
    "/": "beranda",
    "/katalog": "katalog",
    "/layanan": "layanan",
    "/tentang": "tentang",
    "/kontak": "kontak",
    "/blog": "blog",
    "/karir": "karir",
    "/privasi": "privasi",
    "/syarat": "syarat",
    "/profil": "profil",
    "/admin": "admin",
    "/teknisi": "teknisi",
  };
  const PAGE_TO_PATH: Record<string, string> = Object.fromEntries(
    Object.entries(PATH_TO_PAGE).map(([k, v]) => [v, k])
  );

  // Baca URL saat pertama kali halaman dibuka
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/tambahan/')) {
      const t = path.replace('/tambahan/', '');
      setAdditionToken(t);
      setCurrentPage('tambahan');
      return;
    }
    if (path.startsWith('/invoice/')) {
      const t = path.replace('/invoice/', '');
      setInvoiceToken(t);
      setCurrentPage('invoice');
      return;
    }
    if (path.startsWith('/order-invoice/')) {
      const t = path.replace('/order-invoice/', '');
      setOrderInvoiceToken(t);
      setCurrentPage('order-invoice');
      return;
    }
    const page = PATH_TO_PAGE[path];
    if (page && page !== "beranda") setCurrentPage(page);
  }, []);

  // Update URL setiap kali halaman berubah
  useEffect(() => {
    if (currentPage === 'tambahan' || currentPage === 'invoice' || currentPage === 'order-invoice') return;
    const path = PAGE_TO_PATH[currentPage] ?? "/";
    if (window.location.pathname !== path) {
      window.history.pushState({ page: currentPage }, "", path);
    }
  }, [currentPage]);

  // Tangani tombol Back/Forward browser
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const page = e.state?.page ?? PATH_TO_PAGE[window.location.pathname] ?? "beranda";
      setCurrentPage(page);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (
      (currentPage === "admin" || currentPage === "teknisi") &&
      !(
        (authToken && userRole === "admin" && currentPage === "admin") ||
        (authToken && userRole === "teknisi" && currentPage === "teknisi")
      )
    ) {
      setCurrentPage("beranda");
      setPreviousPage("beranda");
    }
  }, [currentPage, authToken, userRole]);

  const handleCheckout = (product: Product) => {
    if (!canUseCart) {
      openLogin();
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.itemType === "product",
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.itemType === "product"
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          itemType: "product" as const,
          image: product.image,
          brand: product.brand,
          capacity: product.capacity,
        },
      ];
    });
    setCurrentPage("checkout");
  };

  const handleAddToCart = (product: Product) => {
    if (!canUseCart) {
      openLogin();
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.itemType === "product",
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.itemType === "product"
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          itemType: "product" as const,
          image: product.image,
          brand: product.brand,
          capacity: product.capacity,
        },
      ];
    });
  };

  const handleAddServiceToCart = (service: Service) => {
    if (!canUseCart) {
      openLogin();
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === service.id && item.itemType === "service",
      );
      if (existing) {
        return prev.map((item) =>
          item.id === service.id && item.itemType === "service"
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: service.id,
          name: service.name,
          price: service.price,
          quantity: 1,
          itemType: "service" as const,
          icon: service.icon,
          description: service.description,
        },
      ];
    });
    setCurrentPage("cart");
  };

  const handleRemoveFromCart = (id: string, itemType: "product" | "service") => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.itemType === itemType)));
  };

  const handleUpdateQuantity = (id: string, itemType: "product" | "service", quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id, itemType);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id && item.itemType === itemType ? { ...item, quantity } : item)),
      );
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleLoginSuccess = (
    token: string,
    role: "admin" | "user" | "teknisi",
  ) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userRole", role);
    setAuthToken(token);
    setUserRole(role);
    if (role === "admin") {
      setCurrentPage("admin");
    } else if (role === "teknisi") {
      setCurrentPage("teknisi");
    } else {
      setCurrentPage(previousPage === "login" ? "beranda" : previousPage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("cart");
    setAuthToken(null);
    setUserRole(null);
    setCart([]);
  };

  const openLogin = () => {
    setPreviousPage(currentPage);
    setCurrentPage("login");
  };

  const closeLogin = () => {
    setCurrentPage(previousPage === "login" ? "beranda" : previousPage);
  };

  // If the current page is 'admin' or 'teknisi', we don't show the standard Navbar/Footer
  if (currentPage === "admin" || currentPage === "teknisi") {
    if (authToken && userRole === "admin" && currentPage === "admin") {
      return <AdminLayout token={authToken} onLogout={handleLogout} />;
    }
    if (authToken && userRole === "teknisi" && currentPage === "teknisi") {
      return <TeknisiDashboard token={authToken} onLogout={handleLogout} />;
    }
    return null;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "beranda":
        return <Home setCurrentPage={setCurrentPage} />;
      case "katalog":
        return (
          <Catalog
            onCheckout={handleCheckout}
            onAddToCart={handleAddToCart}
            onAddServiceToCart={handleAddServiceToCart}
          />
        );
      case "tentang":
        return <About />;
      case "layanan":
        return <Layanan setCurrentPage={setCurrentPage} onAddServiceToCart={handleAddServiceToCart} />;
      case "karir":
        return <Karir setCurrentPage={setCurrentPage} />;
      case "blog":
        return <Blog setCurrentPage={setCurrentPage} />;
      case "privasi":
        return <Privasi />;
      case "syarat":
        return <Syarat />;
      case "kontak":
        return <Contact />;
      case "cart":
        return (
          <Cart
            cart={visibleCart}
            onRemove={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onCheckout={() => setCurrentPage("checkout")}
            onLogin={openLogin}
            authToken={authToken}
            onBrowse={() => setCurrentPage("katalog")}
          />
        );
      case "pesanan-saya":
        if (!authToken) {
          openLogin();
          return null;
        }
        return <UserOrders token={authToken} />;
      case "profil":
        if (!authToken) {
          openLogin();
          return null;
        }
        return <Profile token={authToken} />;
      case "tambahan":
        if (!additionToken) return <Home setCurrentPage={setCurrentPage} />;
        return <CustomerAdditionApproval token={additionToken} />;
      case "invoice":
        if (!invoiceToken) return <Home setCurrentPage={setCurrentPage} />;
        return <InvoiceView token={invoiceToken} />;
      case "order-invoice":
        if (!orderInvoiceToken) return <Home setCurrentPage={setCurrentPage} />;
        return <InvoiceView token={orderInvoiceToken} fetchUrl={`/api/order-invoice/${orderInvoiceToken}`} />;
      case "checkout":
        if (!authToken) {
          openLogin();
          return null;
        }
        return (
          <Checkout
            cart={visibleCart}
            onClearCart={handleClearCart}
            onBack={() => setCurrentPage("cart")}
            onSuccess={() => setCurrentPage("pesanan-saya")}
            authToken={authToken}
          />
        );
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  // Halaman invoice tidak perlu Navbar/Footer (dan tidak boleh tercetak)
  const isInvoicePage = currentPage === "invoice" || currentPage === "order-invoice" || currentPage === "tambahan";

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      {!isInvoicePage && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          authToken={authToken}
          userRole={userRole}
          onLogout={handleLogout}
          onOpenLogin={openLogin}
          cartCount={visibleCart.reduce((sum, item) => sum + item.quantity, 0)}
        />
      )}

      <main className={`grow ${!isInvoicePage && currentPage !== "beranda" ? "pt-20" : ""}`}>
        <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>
      </main>

      {!isInvoicePage && <Footer setCurrentPage={setCurrentPage} />}

      {/* Login Modal Overlay */}
      <AnimatePresence>
        {currentPage === "login" && (
          <Login onLoginSuccess={handleLoginSuccess} onBack={closeLogin} />
        )}
      </AnimatePresence>

      {/* WhatsApp Floating Button */}
      {currentPage !== "admin" && currentPage !== "teknisi" && !isInvoicePage && (
        <a
          href="https://wa.me/6281515729739?text=Halo%20saya%20ingin%20bertanya"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 text-white px-4 py-3 sm:px-5 rounded-full shadow-lg hover:bg-green-600 transition-all hover:-translate-y-1 flex items-center gap-2 font-medium"
        >
          <BrandIcon name="whatsappMono" size={22} className="text-white" />
          <span className="hidden sm:inline">Chat Kami</span>
        </a>
      )}
    </div>
  );
}
